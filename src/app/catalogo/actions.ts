'use server';

import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { calcularPrecioVenta } from '@/lib/pricing/engine';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';
import { formatearDescripcionProducto, obtenerMultiploVenta } from '@/lib/pricing/formatters';
import type { Producto, ProductoConPrecio, Categoria, CampoFiltro } from '@/types';

/**
 * Caché en memoria de corta duración (45s) para evitar descargar miles de productos
 * en cada pulsación de tecla del buscador instantáneo.
 */
interface ProductoIndexado {
  raw: Producto;
  camposCategoria?: CampoFiltro[];
  descripcionFormateada: string;
  textoBusqueda: string;
  numParteLower: string;
  skuLower: string;
  marcaLower: string;
  catLower: string;
  descFormLower: string;
}

interface CatalogoBaseCache {
  timestamp: number;
  productosIndexados: ProductoIndexado[];
  categorias: Categoria[];
  marcasLogos: Record<string, string>;
  margenesMap: Record<string, number>;
  crucesMap: Record<string, boolean>;
  margenesPubMap: Record<string, number>;
}

const CATALOGO_CACHE_TTL_MS = 45_000;
let catalogoBaseCache: CatalogoBaseCache | null = null;
let catalogoBasePromise: Promise<CatalogoBaseCache> | null = null;

async function cargarCatalogoBaseCacheado(): Promise<CatalogoBaseCache> {
  const now = Date.now();
  if (catalogoBaseCache && now - catalogoBaseCache.timestamp < CATALOGO_CACHE_TTL_MS) {
    return catalogoBaseCache;
  }

  if (catalogoBasePromise) {
    return catalogoBasePromise;
  }

  catalogoBasePromise = (async () => {
    try {
      const supabase = createAdminClient();
      const [categoriasRes, configsRes] = await Promise.all([
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

      let allData: Producto[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('marca')
          .range(from, from + step - 1);

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

      const catByLowerName = new Map<string, Categoria>();
      categorias.forEach((c) => {
        catByLowerName.set(c.nombre.toLowerCase().trim(), c);
      });

      const productosIndexados: ProductoIndexado[] = allData.map((prod) => {
        const catObj = catByLowerName.get((prod.categoria || '').toLowerCase().trim());
        const tempProd = {
          ...prod,
          precio_venta: 0,
          moneda_venta: 'MXN' as const,
          formula_aplicada: '',
          _campos_categoria: catObj?.campos_filtro,
        };
        const descripcionFormateada = formatearDescripcionProducto(tempProd, catObj?.campos_filtro);
        const numParteLower = (prod.numero_parte || '').toLowerCase();
        const skuLower = (prod.sku_interno || '').toLowerCase();
        const marcaLower = (prod.marca || '').toLowerCase();
        const catLower = (prod.categoria || '').toLowerCase();
        const descFormLower = descripcionFormateada.toLowerCase();

        let specsText = '';
        if (prod.especificaciones_tecnicas) {
          specsText = Object.values(prod.especificaciones_tecnicas)
            .map((v) => String(v ?? '').toLowerCase())
            .join(' ');
        }

        return {
          raw: prod,
          camposCategoria: catObj?.campos_filtro,
          descripcionFormateada,
          textoBusqueda: `${numParteLower} ${skuLower} ${marcaLower} ${catLower} ${descFormLower} ${specsText}`,
          numParteLower,
          skuLower,
          marcaLower,
          catLower,
          descFormLower,
        };
      });

      const nuevoCache: CatalogoBaseCache = {
        timestamp: Date.now(),
        productosIndexados,
        categorias,
        marcasLogos,
        margenesMap,
        crucesMap,
        margenesPubMap,
      };
      catalogoBaseCache = nuevoCache;
      return nuevoCache;
    } finally {
      catalogoBasePromise = null;
    }
  })();

  return catalogoBasePromise;
}

/**
 * Verifica en el servidor si el usuario actual tiene sesión válida
 * y cuenta con un perfil de cliente aprobado (B2B).
 */
async function verificarClienteB2B(accessToken?: string | null): Promise<boolean> {
  try {
    let token: string | null = null;

    // Priorizar siempre la cookie y header del servidor
    const cookieStore = await cookies();
    token = cookieStore.get('rem-auth-token')?.value || null;

    if (!token) {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!token && accessToken) {
      token = accessToken;
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

function sanitizarProductoConPrecio(
  item: ProductoIndexado,
  tipoCambio: number,
  isB2B: boolean,
  margenesMap: Record<string, number>,
  crucesMap: Record<string, boolean>,
  margenesPubMap: Record<string, number>
): ProductoConPrecio {
  const prod = item.raw;
  const marcaKey = prod.marca ? prod.marca.toUpperCase() : '';
  const margenPersonalizado = marcaKey ? margenesMap[marcaKey] : undefined;
  const margenPublico = marcaKey && margenesPubMap[marcaKey] ? margenesPubMap[marcaKey] : 1.35;
  const aplicaCruce = marcaKey ? Boolean(crucesMap[marcaKey]) : false;

  const resultado = calcularPrecioVenta(
    prod.costo_base,
    prod.moneda_costo,
    'MXN',
    tipoCambio,
    margenPersonalizado,
    aplicaCruce,
    margenPublico
  );

  const precioPublicoFinal = resultado.precioPublico ?? resultado.precioVenta;

  return {
    ...prod,
    costo_base: 0,
    precio_venta: isB2B ? resultado.precioVenta : precioPublicoFinal,
    precio_publico: precioPublicoFinal,
    moneda_venta: resultado.monedaVenta,
    formula_aplicada: '',
    _campos_categoria: item.camposCategoria,
  };
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
  const [isB2B, tcCache, base] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    cargarCatalogoBaseCacheado(),
  ]);

  const catFilterLower = categoriaActiva ? categoriaActiva.toLowerCase().trim() : null;
  const listaFiltrada = catFilterLower
    ? base.productosIndexados.filter((item) => item.catLower === catFilterLower)
    : base.productosIndexados;

  const productosSanitizados = listaFiltrada.map((item) =>
    sanitizarProductoConPrecio(
      item,
      tcCache.valor,
      isB2B,
      base.margenesMap,
      base.crucesMap,
      base.margenesPubMap
    )
  );

  return {
    productos: productosSanitizados,
    categorias: base.categorias,
    marcasLogos: base.marcasLogos,
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

/**
 * Sincroniza los productos almacenados en el carrito (localStorage) con los precios,
 * tipo de cambio, nivel de cliente (B2B vs Público) y múltiplos vigentes en el servidor.
 */
export async function sincronizarPreciosCarrito(
  productoIds: string[],
  accessToken?: string | null
): Promise<ProductoConPrecio[]> {
  if (!productoIds || productoIds.length === 0) return [];

  const uniqueIds = Array.from(new Set(productoIds.filter(Boolean))).slice(0, 300);
  if (uniqueIds.length === 0) return [];

  const supabase = createAdminClient();

  const [isB2B, tcCache, prodsRes, categoriasRes, configsRes] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    supabase.from('productos').select('*').in('id', uniqueIds).eq('activo', true),
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

  if (prodsRes.error || !prodsRes.data) return [];

  const catByLowerName = new Map<string, Categoria>();
  ((categoriasRes.data as Categoria[]) || []).forEach((c) => {
    catByLowerName.set(c.nombre.toLowerCase().trim(), c);
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

  return (prodsRes.data as Producto[]).map((prod) => {
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
      costo_base: 0,
      precio_venta: isB2B ? resultado.precioVenta : precioPublicoFinal,
      precio_publico: precioPublicoFinal,
      moneda_venta: resultado.monedaVenta,
      formula_aplicada: '',
      _campos_categoria: catObj?.campos_filtro,
    };
  });
}

/**
 * Buscador rápido con vista previa instantánea para el Header.
 * Utiliza el índice precalculado en memoria para responder en milisegundos sin saturar Supabase.
 */
export async function buscarVistaPreviaRapida(
  terminoRaw: string,
  accessToken?: string | null,
  limiteProductos: number = 6
): Promise<{
  productos: (ProductoConPrecio & { descripcion_formateada: string })[];
  categorias: { nombre: string; cantidad: number; imagen_url: string | null }[];
  totalCategorias: number;
  totalCoincidencias: number;
  isB2B: boolean;
}> {
  const q = (terminoRaw || '').trim().toLowerCase().slice(0, 120);
  if (q.length < 2) {
    return {
      productos: [],
      categorias: [],
      totalCategorias: 0,
      totalCoincidencias: 0,
      isB2B: false,
    };
  }

  const limiteSeguro = Math.min(Math.max(1, Math.floor(Number(limiteProductos) || 6)), 50);

  const [isB2B, tcCache, base] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    cargarCatalogoBaseCacheado(),
  ]);

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 10);
  const imagenesCatMap = new Map<string, string | null>();
  base.categorias.forEach((c) => {
    imagenesCatMap.set(c.nombre.toLowerCase().trim(), c.imagen_url || null);
  });

  const conteoCategorias: Record<string, number> = {};
  const coincidencias: {
    item: ProductoIndexado;
    score: number;
  }[] = [];

  for (const item of base.productosIndexados) {
    const cumpleTokens = tokens.every((tk) => item.textoBusqueda.includes(tk));
    if (!cumpleTokens) continue;

    const catNombre = item.raw.categoria ? item.raw.categoria.trim() : 'General';
    conteoCategorias[catNombre] = (conteoCategorias[catNombre] || 0) + 1;

    let score = 10;
    if (item.numParteLower === q || item.skuLower === q) {
      score = 100;
    } else if (item.numParteLower.startsWith(q) || item.skuLower.startsWith(q)) {
      score = 85;
    } else if (item.numParteLower.includes(q) || item.skuLower.includes(q)) {
      score = 70;
    } else if (item.marcaLower === q || item.catLower === q) {
      score = 55;
    } else if (
      item.descFormLower.startsWith(q) ||
      item.marcaLower.startsWith(q) ||
      item.catLower.startsWith(q)
    ) {
      score = 40;
    } else if (item.descFormLower.includes(q)) {
      score = 25;
    }

    coincidencias.push({ item, score });
  }

  coincidencias.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.numParteLower.localeCompare(b.item.numParteLower);
  });

  const todasLasCategorias = Object.entries(conteoCategorias)
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
      imagen_url: imagenesCatMap.get(nombre.toLowerCase()) || null,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // Solo calcular precio para los top N productos que realmente se enviarán al cliente
  const topProductos = coincidencias.slice(0, limiteSeguro).map(({ item }) => {
    const prodSanitizado = sanitizarProductoConPrecio(
      item,
      tcCache.valor,
      isB2B,
      base.margenesMap,
      base.crucesMap,
      base.margenesPubMap
    );
    return {
      ...prodSanitizado,
      descripcion_formateada: item.descripcionFormateada,
    };
  });

  return {
    productos: topProductos,
    categorias: todasLasCategorias.slice(0, limiteSeguro > 6 ? 24 : 4),
    totalCategorias: todasLasCategorias.length,
    totalCoincidencias: coincidencias.length,
    isB2B,
  };
}

/**
 * Resuelve una lista de códigos y cantidades pegados desde Excel o texto libre
 * para la función de Carga Rápida de Pedido B2B.
 * Incluye límites de seguridad y detección de códigos ambiguos entre múltiples marcas.
 */
export async function resolverCargaRapidaCodigos(
  entradas: { codigo: string; cantidad: number }[],
  accessToken?: string | null
): Promise<{
  encontrados: {
    producto: ProductoConPrecio;
    cantidadSolicitada: number;
    cantidadFinal: number;
    multiplo: number;
  }[];
  ambiguos?: {
    codigo: string;
    cantidadSolicitada: number;
    opciones: ProductoConPrecio[];
  }[];
  noEncontrados: string[];
}> {
  if (!entradas || !Array.isArray(entradas) || entradas.length === 0) {
    return { encontrados: [], ambiguos: [], noEncontrados: [] };
  }

  const entradasLimitadas = entradas.slice(0, 300);

  const [isB2B, tcCache, base] = await Promise.all([
    verificarClienteB2B(accessToken),
    obtenerTipoCambio(),
    cargarCatalogoBaseCacheado(),
  ]);

  // Agrupar en listas para no sobrescribir códigos que existan en más de una marca
  const mapaNumParteExacto = new Map<string, ProductoIndexado[]>();
  const mapaSkuExacto = new Map<string, ProductoIndexado[]>();
  const mapaSinGuiones = new Map<string, ProductoIndexado[]>();

  const agregarAlMapa = (mapa: Map<string, ProductoIndexado[]>, key: string, item: ProductoIndexado) => {
    const actual = mapa.get(key);
    if (actual) {
      if (!actual.some((x) => x.raw.id === item.raw.id)) {
        actual.push(item);
      }
    } else {
      mapa.set(key, [item]);
    }
  };

  for (const item of base.productosIndexados) {
    const np = (item.raw.numero_parte || '').trim().toUpperCase();
    const sku = (item.raw.sku_interno || '').trim().toUpperCase();
    if (np) {
      agregarAlMapa(mapaNumParteExacto, np, item);
      agregarAlMapa(mapaSinGuiones, np.replace(/[\s\-_]/g, ''), item);
    }
    if (sku) {
      agregarAlMapa(mapaSkuExacto, sku, item);
      agregarAlMapa(mapaSinGuiones, sku.replace(/[\s\-_]/g, ''), item);
    }
  }

  const encontrados: {
    producto: ProductoConPrecio;
    cantidadSolicitada: number;
    cantidadFinal: number;
    multiplo: number;
  }[] = [];
  const ambiguos: {
    codigo: string;
    cantidadSolicitada: number;
    opciones: ProductoConPrecio[];
  }[] = [];
  const noEncontrados: string[] = [];

  for (const item of entradasLimitadas) {
    const rawCodigo = String(item?.codigo || '').trim().slice(0, 64);
    if (!rawCodigo) continue;

    const cantRaw = Math.floor(Number(item?.cantidad) || 1);
    const cantSol = Math.min(Math.max(1, isNaN(cantRaw) ? 1 : cantRaw), 100_000);

    const upper = rawCodigo.toUpperCase();
    const clean = upper.replace(/[\s\-_]/g, '');

    // Prioridad 1: Coincidencia exacta en numero_parte
    // Prioridad 2: Coincidencia exacta en sku_interno
    // Prioridad 3: Coincidencia normalizada sin guiones (solo si no hubo coincidencia exacta)
    let candidatos =
      mapaNumParteExacto.get(upper) ||
      mapaSkuExacto.get(upper) ||
      mapaSinGuiones.get(clean) ||
      [];

    if (candidatos.length === 0) {
      noEncontrados.push(rawCodigo);
      continue;
    }

    if (candidatos.length > 1) {
      // Múltiples marcas tienen el mismo código: devolver en `ambiguos` para que el usuario elija la marca
      ambiguos.push({
        codigo: rawCodigo,
        cantidadSolicitada: cantSol,
        opciones: candidatos.map((c) =>
          sanitizarProductoConPrecio(
            c,
            tcCache.valor,
            isB2B,
            base.margenesMap,
            base.crucesMap,
            base.margenesPubMap
          )
        ),
      });
      continue;
    }

    const prodSanitizado = sanitizarProductoConPrecio(
      candidatos[0],
      tcCache.valor,
      isB2B,
      base.margenesMap,
      base.crucesMap,
      base.margenesPubMap
    );
    const multiplo = obtenerMultiploVenta(prodSanitizado);
    const cantFinal =
      multiplo > 1
        ? Math.max(multiplo, Math.ceil(cantSol / multiplo) * multiplo)
        : cantSol;

    encontrados.push({
      producto: prodSanitizado,
      cantidadSolicitada: cantSol,
      cantidadFinal: cantFinal,
      multiplo,
    });
  }

  return { encontrados, ambiguos, noEncontrados };
}
