import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EventoActualizacionPrecios } from '@/types/product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    const body = await request.json();
    const { items, marca, usuario } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No se recibieron artículos para actualizar.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Obtener todos los productos existentes necesarios para hacer match eficiente
    // Traemos id, sku_interno, numero_parte, costo_base, moneda_costo, especificaciones_tecnicas
    const { data: productosExistentes, error: queryError } = await supabase
      .from('productos')
      .select('id, sku_interno, numero_parte, costo_base, moneda_costo, especificaciones_tecnicas, marca');

    if (queryError) {
      console.error('[API/actualizar-precios] Error al consultar productos:', queryError);
      return NextResponse.json({ error: 'Error al consultar productos existentes en la base de datos.' }, { status: 500 });
    }

    // Indexar productos existentes por número de parte y por SKU interno (en mayúsculas y sin espacios)
    const mapaPorParte = new Map<string, any>();
    const mapaPorSku = new Map<string, any>();

    (productosExistentes || []).forEach((prod) => {
      if (prod.numero_parte) {
        const keyParte = String(prod.numero_parte).trim().toUpperCase();
        mapaPorParte.set(keyParte, prod);
      }
      if (prod.sku_interno) {
        const keySku = String(prod.sku_interno).trim().toUpperCase();
        mapaPorSku.set(keySku, prod);
      }
    });

    // 2. Clasificar los items del Excel
    const itemsParaActualizar: Array<{
      id: string;
      costo_base: number;
      moneda_costo: 'USD' | 'MXN';
      especificaciones_tecnicas: Record<string, any>;
      updated_at: string;
    }> = [];

    const noEncontrados: string[] = [];
    const ahoraIso = new Date().toISOString();

    items.forEach((item: { numero_parte: string; costo: number; moneda?: 'USD' | 'MXN' }) => {
      const codigoBuscado = String(item.numero_parte).trim().toUpperCase();
      const productoMatch = mapaPorParte.get(codigoBuscado) || mapaPorSku.get(codigoBuscado);

      if (productoMatch) {
        // Limpiamos la bandera requiere_confirmacion porque acaba de ser actualizado con precio fresco
        const specsPrevias = productoMatch.especificaciones_tecnicas || {};
        const specsActualizadas = {
          ...specsPrevias,
          requiere_confirmacion: false,
        };

        itemsParaActualizar.push({
          id: productoMatch.id,
          costo_base: item.costo,
          moneda_costo: item.moneda || productoMatch.moneda_costo || 'USD',
          especificaciones_tecnicas: specsActualizadas,
          updated_at: ahoraIso,
        });
      } else {
        noEncontrados.push(item.numero_parte);
      }
    });

    if (itemsParaActualizar.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Ninguno de los números de parte del archivo coincide con el catálogo actual.',
        total_procesados: items.length,
        actualizados: 0,
        no_encontrados: noEncontrados,
      }, { status: 404 });
    }

    // 3. Ejecutar las actualizaciones en la base de datos por lotes (chunks) para máximo rendimiento y seguridad
    const CHUNK_SIZE = 50;
    let actualizadosExitosos = 0;

    for (let i = 0; i < itemsParaActualizar.length; i += CHUNK_SIZE) {
      const chunk = itemsParaActualizar.slice(i, i + CHUNK_SIZE);

      // Usamos Promise.all para actualizar concurrentemente los elementos del lote
      const promesas = chunk.map((p) =>
        supabase
          .from('productos')
          .update({
            costo_base: p.costo_base,
            moneda_costo: p.moneda_costo,
            especificaciones_tecnicas: p.especificaciones_tecnicas,
            updated_at: p.updated_at,
          })
          .eq('id', p.id)
      );

      const resultados = await Promise.all(promesas);
      resultados.forEach((res) => {
        if (!res.error) actualizadosExitosos++;
        else console.error('[API/actualizar-precios] Error actualizando producto:', res.error);
      });
    }

    // 4. Registrar evento en la Bitácora
    const eventoId = `act-${Date.now()}`;
    const nuevoEvento: EventoActualizacionPrecios = {
      id: eventoId,
      fecha: ahoraIso,
      usuario: usuario || 'Administrador',
      marca: marca || 'General / Múltiples',
      total_procesados: items.length,
      total_actualizados: actualizadosExitosos,
      total_no_encontrados: noEncontrados.length,
      no_encontrados: noEncontrados.slice(0, 100), // Guardamos los primeros 100 para no sobrecargar el JSON
    };

    // Obtener bitácora previa y agregar el nuevo evento al inicio (máximo 150 registros históricos)
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
      evento: nuevoEvento,
    });
  } catch (error: any) {
    console.error('[API/actualizar-precios POST] Error fatal:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
