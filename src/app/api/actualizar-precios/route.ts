import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin-auth';
import { EventoActualizacionPrecios } from '@/types/product';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validar autorización de administrador
    const authCheck = await verificarAdmin(request);
    if (!authCheck.autorizado) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'bitacora_actualizaciones_precios')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[API/actualizar-precios GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bitacora: EventoActualizacionPrecios[] = Array.isArray(data?.valor) ? data.valor : [];
    return NextResponse.json({ success: true, bitacora });
  } catch (err: any) {
    console.error('[API/actualizar-precios GET] Error inesperado:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validar autorización de administrador
    const authCheck = await verificarAdmin(request);
    if (!authCheck.autorizado) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const { items, marca } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No se recibieron artículos para actualizar.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Obtener TODOS los productos existentes usando paginación .range() (supera el límite de 1000 filas)
    const productosExistentes: any[] = [];
    const step = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error: queryError } = await supabase
        .from('productos')
        .select('id, sku_interno, numero_parte, costo_base, moneda_costo, especificaciones_tecnicas, marca')
        .range(from, from + step - 1);

      if (queryError) {
        console.error('[API/actualizar-precios] Error al consultar productos:', queryError);
        return NextResponse.json({ error: 'Error al consultar catálogo en la base de datos.' }, { status: 500 });
      }

      if (data && data.length > 0) {
        productosExistentes.push(...data);
        if (data.length < step) hasMore = false;
        else from += step;
      } else {
        hasMore = false;
      }
    }

    // 3. Indexar productos existentes:
    // Creamos índices por marca (si se especificó marca) y globales
    const marcaObjetivoNorm = marca && typeof marca === 'string' && marca.trim() !== '' && marca.toLowerCase() !== 'todas'
      ? marca.trim().toLowerCase()
      : null;

    // Mapas agrupados
    const mapaPorParteYMarca = new Map<string, any>(); // key: "PARTE|MARCA"
    const mapaPorParteGlobal = new Map<string, any[]>(); // key: "PARTE" -> array de productos (para detectar ambigüedades)
    const mapaPorSkuGlobal = new Map<string, any>();     // key: "SKU"

    productosExistentes.forEach((prod) => {
      const parteNorm = prod.numero_parte ? String(prod.numero_parte).trim().toUpperCase() : null;
      const skuNorm = prod.sku_interno ? String(prod.sku_interno).trim().toUpperCase() : null;
      const prodMarcaNorm = prod.marca ? String(prod.marca).trim().toLowerCase() : '';

      if (parteNorm) {
        // Mapa parte + marca
        mapaPorParteYMarca.set(`${parteNorm}|${prodMarcaNorm}`, prod);

        // Mapa global de partes
        if (!mapaPorParteGlobal.has(parteNorm)) {
          mapaPorParteGlobal.set(parteNorm, []);
        }
        mapaPorParteGlobal.get(parteNorm)!.push(prod);
      }

      if (skuNorm) {
        mapaPorSkuGlobal.set(skuNorm, prod);
      }
    });

    // 4. Clasificar y emparejar los items del Excel
    const itemsParaActualizar: Array<{
      id: string;
      costo_base: number;
      moneda_costo: 'USD' | 'MXN';
      costo_actualizado_at: string;
      updated_at: string;
      requiere_confirmacion: boolean;
      especificaciones_tecnicas: Record<string, any>;
    }> = [];

    const noEncontrados: string[] = [];
    const ambiguos: string[] = [];
    const ahoraIso = new Date().toISOString();

    items.forEach((item: { numero_parte: string; costo: number; moneda?: 'USD' | 'MXN' | null }) => {
      const codigoBuscado = String(item.numero_parte).trim().toUpperCase();

      let productoMatch: any = null;

      // Prioridad 1: Si hay marca objetivo, buscar en esa marca
      if (marcaObjetivoNorm) {
        productoMatch = mapaPorParteYMarca.get(`${codigoBuscado}|${marcaObjetivoNorm}`);
      }

      // Prioridad 2: Buscar por SKU exacto
      if (!productoMatch) {
        productoMatch = mapaPorSkuGlobal.get(codigoBuscado);
      }

      // Prioridad 3: Buscar globalmente por número de parte
      if (!productoMatch) {
        const matchesGlobales = mapaPorParteGlobal.get(codigoBuscado) || [];
        if (matchesGlobales.length === 1) {
          productoMatch = matchesGlobales[0];
        } else if (matchesGlobales.length > 1) {
          // Si no se especificó marca y coincide con más de una marca distinta, marcar como ambiguo
          ambiguos.push(`${item.numero_parte} (coincide con marcas: ${matchesGlobales.map((m) => m.marca).join(', ')})`);
          return;
        }
      }

      if (productoMatch) {
        // Moneda inteligente: si el Excel traía moneda válida, usarla; si venía vacía, conservar la del producto
        const monedaFinal: 'USD' | 'MXN' =
          item.moneda && (item.moneda === 'USD' || item.moneda === 'MXN')
            ? item.moneda
            : (productoMatch.moneda_costo === 'MXN' ? 'MXN' : 'USD');

        // Limpiar la bandera requiere_confirmacion de especificaciones_tecnicas si existía allí
        const specsPrevias = { ...(productoMatch.especificaciones_tecnicas || {}) };
        delete specsPrevias.requiere_confirmacion;

        itemsParaActualizar.push({
          id: productoMatch.id,
          costo_base: item.costo,
          moneda_costo: monedaFinal,
          costo_actualizado_at: ahoraIso,
          updated_at: ahoraIso,
          requiere_confirmacion: false,
          especificaciones_tecnicas: specsPrevias,
        });
      } else {
        noEncontrados.push(item.numero_parte);
      }
    });

    if (itemsParaActualizar.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Ninguno de los números de parte del archivo coincide con el catálogo actual.',
        total_procesados: items.length,
        actualizados: 0,
        no_encontrados: noEncontrados,
        ambiguos,
      }, { status: 404 });
    }

    // 5. Intentar primero ejecutar vía RPC atómica `actualizar_precios_lote` si la función existe en la BD
    let actualizadosExitosos = 0;
    let rpcExitoso = false;

    try {
      const payloadRpc = itemsParaActualizar.map((i) => ({
        id: i.id,
        costo: i.costo_base,
        moneda: i.moneda_costo,
      }));

      const { data: countRpc, error: rpcError } = await supabase.rpc('actualizar_precios_lote', {
        p_items: payloadRpc,
      });

      if (!rpcError && typeof countRpc === 'number') {
        actualizadosExitosos = countRpc;
        rpcExitoso = true;
      }
    } catch {
      rpcExitoso = false;
    }

    // Fallback: Si el RPC aún no fue ejecutado en SQL, actualizar por lotes concurrentes en Supabase
    if (!rpcExitoso) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < itemsParaActualizar.length; i += CHUNK_SIZE) {
        const chunk = itemsParaActualizar.slice(i, i + CHUNK_SIZE);

        const promesas = chunk.map((p) => {
          const updatePayload: Record<string, any> = {
            costo_base: p.costo_base,
            moneda_costo: p.moneda_costo,
            costo_actualizado_at: p.costo_actualizado_at,
            updated_at: p.updated_at,
            requiere_confirmacion: p.requiere_confirmacion,
            especificaciones_tecnicas: p.especificaciones_tecnicas,
          };

          return supabase.from('productos').update(updatePayload).eq('id', p.id);
        });

        const resultados = await Promise.all(promesas);
        resultados.forEach((res) => {
          if (!res.error) actualizadosExitosos++;
          else console.error('[API/actualizar-precios] Error al actualizar fila:', res.error);
        });
      }
    }

    // 6. Registrar evento en la Bitácora con el correo del administrador autenticado
    const eventoId = `act-${Date.now()}`;
    const nuevoEvento: EventoActualizacionPrecios = {
      id: eventoId,
      fecha: ahoraIso,
      usuario: authCheck.email || authCheck.nombre || 'Administrador',
      marca: marca && marca.trim() ? marca.trim() : 'General / Múltiples',
      total_procesados: items.length,
      total_actualizados: actualizadosExitosos,
      total_no_encontrados: noEncontrados.length,
      no_encontrados: noEncontrados.slice(0, 100),
    };

    try {
      const { data: bitacoraPrevData } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'bitacora_actualizaciones_precios')
        .maybeSingle();

      const bitacoraExistente: EventoActualizacionPrecios[] = Array.isArray(bitacoraPrevData?.valor)
        ? bitacoraPrevData.valor
        : [];

      const bitacoraActualizada = [nuevoEvento, ...bitacoraExistente].slice(0, 150);

      await supabase.from('configuracion').upsert(
        [
          {
            clave: 'bitacora_actualizaciones_precios',
            valor: bitacoraActualizada,
          },
        ],
        { onConflict: 'clave' }
      );
    } catch (bitacoraErr) {
      console.warn('[API/actualizar-precios] Advertencia al guardar bitácora:', bitacoraErr);
    }

    return NextResponse.json({
      success: true,
      message: `¡Actualización completada! ${actualizadosExitosos} productos actualizados con éxito.`,
      total_procesados: items.length,
      actualizados: actualizadosExitosos,
      total_no_encontrados: noEncontrados.length,
      no_encontrados: noEncontrados,
      ambiguos,
      evento: nuevoEvento,
    });
  } catch (error: any) {
    console.error('[API/actualizar-precios POST] Error fatal:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
