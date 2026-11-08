import { createAdminClient } from '@/lib/supabase/admin';
import { calcularPrecioVenta } from '@/lib/pricing/engine';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';
import { formatearDescripcionProducto, obtenerMultiploVenta } from '@/lib/pricing/formatters';
import type { Producto, Categoria } from '@/types';

export interface PartidaEntrada {
  producto_id?: string;
  cantidad: number;
  numero_parte?: string;
  marca?: string;
  descripcion?: string;
  sku_interno?: string | null;
}

export interface PartidaVerificada {
  producto_id: string;
  sku_interno: string | null;
  numero_parte: string;
  marca: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
  total: number;
  moneda: 'MXN' | 'USD';
}

export interface ResultadoVerificacionPrecios {
  partidas: PartidaVerificada[];
  subtotal: number;
  iva: number;
  total: number;
  moneda: 'MXN' | 'USD';
  tipoCambio: number;
}

/**
 * Genera un código corto aleatorio alfanumérico (sin caracteres ambiguos)
 * para evitar colisiones de folios en solicitudes concurrentes.
 */
export function generarSufijoFolio(longitud = 2): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < longitud; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Recalcula desde cero en el servidor los precios unitarios, múltiplos de empaque,
 * importes, subtotal, IVA y total directamente desde la base de datos.
 * Ignora cualquier precio enviado por el cliente en el navegador.
 */
export async function recalcularPartidasServidor(
  partidasInput: PartidaEntrada[],
  esClienteB2B: boolean
): Promise<ResultadoVerificacionPrecios> {
  if (!partidasInput || partidasInput.length === 0) {
    throw new Error('La solicitud no contiene partidas válidas.');
  }

  const supabase = createAdminClient();
  const productIds = Array.from(
    new Set(
      partidasInput
        .map((p) => p.producto_id)
        .filter((id): id is string => Boolean(id && typeof id === 'string'))
    )
  );

  if (productIds.length === 0) {
    throw new Error('Las partidas no contienen identificadores de producto válidos.');
  }

  const [tcCache, productosRes, categoriasRes, configsRes] = await Promise.all([
    obtenerTipoCambio(),
    supabase
      .from('productos')
      .select('*')
      .in('id', productIds),
    supabase.from('categorias').select('*'),
    supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', [
        'marcas_margenes',
        'marcas_cruce_volumen',
        'marcas_margenes_publico',
      ]),
  ]);

  if (productosRes.error || !productosRes.data) {
    throw new Error('No se pudieron verificar los productos en la base de datos.');
  }

  const productosMap = new Map<string, Producto>();
  (productosRes.data as Producto[]).forEach((prod) => {
    productosMap.set(prod.id, prod);
  });

  const categoriasMap = new Map<string, Categoria>();
  ((categoriasRes.data as Categoria[]) || []).forEach((cat) => {
    categoriasMap.set(cat.nombre.toLowerCase().trim(), cat);
  });

  const configMap: Record<string, any> = {};
  (configsRes.data || []).forEach((row: { clave: string; valor: any }) => {
    configMap[row.clave] = row.valor;
  });

  const margenesMap: Record<string, number> = configMap['marcas_margenes'] || {};
  const crucesMap: Record<string, boolean> = configMap['marcas_cruce_volumen'] || {};
  const margenesPubMap: Record<string, number> = configMap['marcas_margenes_publico'] || {};

  const monedaVenta = 'MXN' as const;
  const tipoCambio = tcCache.valor;

  const partidasVerificadas: PartidaVerificada[] = [];
  let subtotalAcumulado = 0;

  for (const item of partidasInput) {
    if (!item.producto_id) {
      throw new Error(`Partida sin identificador de producto (${item.numero_parte || 'desconocido'}).`);
    }

    const prod = productosMap.get(item.producto_id);
    if (!prod) {
      throw new Error(`El producto ${item.numero_parte || item.producto_id} ya no se encuentra disponible.`);
    }

    const catObj = categoriasMap.get((prod.categoria || '').toLowerCase().trim());
    const prodConMeta = {
      ...prod,
      _campos_categoria: catObj?.campos_filtro,
    };

    // Validar cantidad y múltiplo de venta (ej. cajas de 10 insertos)
    const multiplo = obtenerMultiploVenta(prodConMeta);
    const cantRaw = Number(item.cantidad);
    const cantBase = Number.isFinite(cantRaw) && cantRaw > 0 ? Math.floor(cantRaw) : multiplo;
    const cantidadValidada = Math.max(multiplo, Math.ceil(cantBase / multiplo) * multiplo);

    // Calcular precio oficial en el servidor
    const marcaKey = prod.marca ? prod.marca.toUpperCase() : '';
    const margenPersonalizado = marcaKey ? margenesMap[marcaKey] : undefined;
    const margenPublico = marcaKey && margenesPubMap[marcaKey] ? margenesPubMap[marcaKey] : 1.35;
    const aplicaCruce = marcaKey ? Boolean(crucesMap[marcaKey]) : false;

    const resultadoPrecio = calcularPrecioVenta(
      prod.costo_base,
      prod.moneda_costo,
      monedaVenta,
      tipoCambio,
      margenPersonalizado,
      aplicaCruce,
      margenPublico
    );

    const precioPublicoFinal = resultadoPrecio.precioPublico ?? resultadoPrecio.precioVenta;
    const precioUnitarioOficial = esClienteB2B
      ? resultadoPrecio.precioVenta
      : precioPublicoFinal;

    const importeOficial = Math.round(precioUnitarioOficial * cantidadValidada * 100) / 100;
    subtotalAcumulado += importeOficial;

    partidasVerificadas.push({
      producto_id: prod.id,
      sku_interno: prod.sku_interno || null,
      numero_parte: prod.numero_parte,
      marca: prod.marca,
      descripcion: formatearDescripcionProducto(prodConMeta as any),
      cantidad: cantidadValidada,
      precio_unitario: precioUnitarioOficial,
      importe: importeOficial,
      total: importeOficial,
      moneda: monedaVenta,
    });
  }

  const subtotal = Math.round(subtotalAcumulado * 100) / 100;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;

  return {
    partidas: partidasVerificadas,
    subtotal,
    iva,
    total,
    moneda: monedaVenta,
    tipoCambio,
  };
}
