'use server';

import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { calcularPrecioVenta } from '@/lib/pricing/engine';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';
import type { Producto, ProductoConPrecio, Categoria, CampoFiltro } from '@/types';

/**
 * Verifica en el servidor si el usuario actual tiene sesión válida
 * y cuenta con un perfil de cliente aprobado (B2B).
 */
async function verificarClienteB2B(accessToken?: string | null): Promise<boolean> {
  try {
    let token = accessToken || null;

    if (!token) {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('rem-auth-token')?.value || null;
    }

    if (!token) return false;

    const supabase = createAdminClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return false;

    const { data: perfil } = await supabase
      .from('perfiles_clientes')
      .select('estatus')
      .eq('id', userData.user.id)
      .maybeSingle();

    return perfil?.estatus === 'aprobado';
  } catch {
    return false;
  }
}

/**
 * Obtiene el catálogo público calculando los precios en el servidor
 * y ocultando costos base y márgenes confidenciales al navegador.
 */
export async function obtenerCatalogoPublico(
  categoriaActiva?: string | null,
  accessToken?: string | null
): Promise<{
  productos: ProductoConPrecio[];
  categorias: Categoria[];
  marcasLogos: Record<string, string>;
  isB2B: boolean;
}> {
  const supabase = createAdminClient();

  // Ejecutar consultas de metadatos, sesión y tipo de cambio en paralelo
  const [
    isB2B,
    tcCache,
    categoriasRes,
    configsRes,
  ] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    supabase.from('categorias').select('*').order('nombre'),
    supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', [
        'marcas_logos',
        'marcas_margenes',
        'marcas_cruce_volumen',
        'marcas_margenes_publico',
      ]),
  ]);

  const categorias: Categoria[] = (categoriasRes.data as Categoria[]) || [];
  const configMap: Record<string, any> = {};
  (configsRes.data || []).forEach((row: { clave: string; valor: any }) => {
    configMap[row.clave] = row.valor;
  });

  const marcasLogos: Record<string, string> = configMap['marcas_logos'] || {};
  const margenesMap: Record<string, number> = configMap['marcas_margenes'] || {};
  const crucesMap: Record<string, boolean> = configMap['marcas_cruce_volumen'] || {};
  const margenesPubMap: Record<string, number> = configMap['marcas_margenes_publico'] || {};

  // Descargar productos activos en lotes desde el servidor
  let allData: Producto[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('marca')
      .range(from, from + step - 1);

    if (categoriaActiva) {
      query = query.ilike('categoria', categoriaActiva);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[CatalogoActions] Error cargando productos:', error);
      break;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...(data as Producto[])];
      if (data.length < step) hasMore = false;
      else from += step;
    } else {
      hasMore = false;
    }
  }

  // Mapa rápido de categorías por nombre en minúsculas
  const catByLowerName = new Map<string, Categoria>();
  categorias.forEach((c) => {
    catByLowerName.set(c.nombre.toLowerCase().trim(), c);
  });

  const monedaVenta = 'MXN' as const;
  const tipoCambio = tcCache.valor;

  const productosSanitizados: ProductoConPrecio[] = allData.map((prod) => {
    const marcaKey = prod.marca ? prod.marca.toUpperCase() : '';
    const margenPersonalizado = marcaKey ? margenesMap[marcaKey] : undefined;
    const margenPublico = marcaKey && margenesPubMap[marcaKey] ? margenesPubMap[marcaKey] : 1.35;
    const aplicaCruce = marcaKey ? Boolean(crucesMap[marcaKey]) : false;

    const resultado = calcularPrecioVenta(
      prod.costo_base,
      prod.moneda_costo,
      monedaVenta,
      tipoCambio,
      margenPersonalizado,
      aplicaCruce,
      margenPublico
    );

    const catObj = catByLowerName.get((prod.categoria || '').toLowerCase().trim());
    const precioPublicoFinal = resultado.precioPublico ?? resultado.precioVenta;

    return {
      ...prod,
      // Ocultar costo_base y fórmula interna al navegador
      costo_base: 0,
      precio_venta: isB2B ? resultado.precioVenta : precioPublicoFinal,
      precio_publico: precioPublicoFinal,
      moneda_venta: resultado.monedaVenta,
      formula_aplicada: '',
      _campos_categoria: catObj?.campos_filtro,
    };
  });

  return {
    productos: productosSanitizados,
    categorias,
    marcasLogos,
    isB2B,
  };
}

/**
 * Obtiene el detalle de un producto individual calculando su precio en el servidor
 * y ocultando costos base y márgenes confidenciales.
 */
export async function obtenerDetalleProductoPublico(
  id: string,
  accessToken?: string | null
): Promise<{
  producto: ProductoConPrecio | null;
  marcaLogoUrl: string | null;
  camposFiltro: CampoFiltro[];
  isB2B: boolean;
}> {
  const supabase = createAdminClient();

  const [isB2B, tcCache, prodRes, configsRes] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', [
        'marcas_logos',
        'marcas_margenes',
        'marcas_cruce_volumen',
        'marcas_margenes_publico',
      ]),
  ]);

  if (prodRes.error || !prodRes.data) {
    return {
      producto: null,
      marcaLogoUrl: null,
      camposFiltro: [],
      isB2B,
    };
  }

  const prodData = prodRes.data as Producto;

  const configMap: Record<string, any> = {};
  (configsRes.data || []).forEach((row: { clave: string; valor: any }) => {
    configMap[row.clave] = row.valor;
  });

  const marcasLogos: Record<string, string> = configMap['marcas_logos'] || {};
  const margenesMap: Record<string, number> = configMap['marcas_margenes'] || {};
  const crucesMap: Record<string, boolean> = configMap['marcas_cruce_volumen'] || {};
  const margenesPubMap: Record<string, number> = configMap['marcas_margenes_publico'] || {};

  const marcaLogoUrl = prodData.marca && marcasLogos[prodData.marca] ? marcasLogos[prodData.marca] : null;

  const marcaKey = prodData.marca ? prodData.marca.toUpperCase() : '';
  const margenMarcaUSA = marcaKey && margenesMap[marcaKey] ? Number(margenesMap[marcaKey]) : undefined;
  const aplicaCruce = marcaKey && crucesMap[marcaKey] ? Boolean(crucesMap[marcaKey]) : false;
  const margenPublico = marcaKey && margenesPubMap[marcaKey] ? Number(margenesPubMap[marcaKey]) : 1.35;

  const resultado = calcularPrecioVenta(
    prodData.costo_base,
    prodData.moneda_costo,
    'MXN',
    tcCache.valor,
    margenMarcaUSA,
    aplicaCruce,
    margenPublico
  );

  const { data: catData } = await supabase
    .from('categorias')
    .select('campos_filtro')
    .ilike('nombre', prodData.categoria || '')
    .maybeSingle();

  const camposFiltro: CampoFiltro[] = (catData?.campos_filtro as CampoFiltro[]) || [];
  const precioPublicoFinal = resultado.precioPublico ?? resultado.precioVenta;

  const productoSanitizado: ProductoConPrecio = {
    ...prodData,
    costo_base: 0,
    precio_venta: isB2B ? resultado.precioVenta : precioPublicoFinal,
    precio_publico: precioPublicoFinal,
    moneda_venta: resultado.monedaVenta,
    formula_aplicada: '',
    _campos_categoria: camposFiltro,
  };

  return {
    producto: productoSanitizado,
    marcaLogoUrl,
    camposFiltro,
    isB2B,
  };
}
