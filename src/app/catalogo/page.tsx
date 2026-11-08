'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/catalogo/ProductGrid';
import SearchBar from '@/components/catalogo/SearchBar';
import FilterSidebar from '@/components/catalogo/FilterSidebar';
import CargaRapidaModal from '@/components/cotizacion/CargaRapidaModal';
import { supabase, syncAuthCookie } from '@/lib/supabase/client';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import { obtenerCatalogoPublico } from '@/app/catalogo/actions';
import type { ProductoConPrecio, Categoria, CampoFiltro } from '@/types';

interface ProductoConCacheBusqueda extends ProductoConPrecio {
  _desc_busqueda?: string;
}

// Helper case-insensitive para extraer especificaciones técnicas
function getSpecValue(specs: Record<string, any> | undefined, key: string) {
  if (!specs) return undefined;

  let val: any;
  if (specs[key] !== undefined) {
    val = specs[key];
  } else {
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(specs).find((k) => k.toLowerCase() === lowerKey);
    val = foundKey ? specs[foundKey] : undefined;
  }

  // Sanitize wire/letter drill sizes (e.g., #1" -> #1, H" -> H)
  if (typeof val === 'string') {
    const cleanVal = val.trim();
    if ((cleanVal.startsWith('#') || /^[A-Za-z]"$/.test(cleanVal)) && cleanVal.endsWith('"')) {
      val = cleanVal.slice(0, -1);
    }
  }

  return val;
}

export default function CatalogoPage() {
  const [productosBase, setProductosBase] = useState<ProductoConCacheBusqueda[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarCargaRapida, setMostrarCargaRapida] = useState(false);
  const [marcasLogos, setMarcasLogos] = useState<Record<string, string>>({});
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [urlInicializada, setUrlInicializada] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, string[]>>({});
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('relevancia');
  const [loading, setLoading] = useState(true);
  const [isB2B, setIsB2B] = useState(false);

  const autoCheckDone = useRef(false);

  // 1. Leer parámetros iniciales de la URL una sola vez al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCategoria = params.get('categoria');
      if (urlCategoria) {
        setCategoriaActiva(urlCategoria);
      }
      const urlSearch = params.get('q');
      if (urlSearch) {
        setBusqueda(urlSearch);
      }

      const initialFiltros: Record<string, string[]> = {};
      params.forEach((value, key) => {
        if (key.startsWith('f_')) {
          const filterName = key.replace('f_', '');
          initialFiltros[filterName] = [value];
        }
      });

      if (Object.keys(initialFiltros).length > 0) {
        setFiltrosActivos(initialFiltros);
      }
    }
    setUrlInicializada(true);
  }, []);

  // 2. Descargar productos del servidor ÚNICAMENTE cuando cambia la categoría activa
  useEffect(() => {
    if (!urlInicializada) return;
    let isMounted = true;

    async function cargarDatosServidor() {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          syncAuthCookie(session.access_token);
        }

        const res = await obtenerCatalogoPublico(
          categoriaActiva,
          session?.access_token || null
        );

        if (!isMounted) return;

        // Pre-calcular la descripción formateada en minúsculas una sola vez por carga
        const conCache: ProductoConCacheBusqueda[] = res.productos.map((prod) => ({
          ...prod,
          _desc_busqueda: formatearDescripcionProducto(prod).toLowerCase(),
        }));

        setCategorias(res.categorias);
        setMarcasLogos(res.marcasLogos);
        setIsB2B(res.isB2B);
        setProductosBase(conCache);
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    cargarDatosServidor();

    return () => {
      isMounted = false;
    };
  }, [categoriaActiva, urlInicializada]);

  // 3. Filtrado cruzado, ordenamiento y facetas 100% en memoria (instantáneo, 0 llamadas a DB)
  const {
    productos,
    marcasDisponibles,
    camposFiltro,
    opcionesDinamicas,
  } = useMemo(() => {
    const terminoBusqueda = busqueda.toLowerCase().trim();

    const cumpleFiltrosCruzados = (
      prod: ProductoConCacheBusqueda,
      llaveAIgnorar: string | null = null
    ) => {
      if (terminoBusqueda) {
        const descFormateada = prod._desc_busqueda || '';
        const matchBusqueda =
          (prod.numero_parte?.toLowerCase().includes(terminoBusqueda) || false) ||
          (prod.marca?.toLowerCase().includes(terminoBusqueda) || false) ||
          (prod.categoria?.toLowerCase().includes(terminoBusqueda) || false) ||
          (prod.sku_interno?.toLowerCase().includes(terminoBusqueda) || false) ||
          descFormateada.includes(terminoBusqueda) ||
          Object.entries(prod.especificaciones_tecnicas || {}).some(
            ([k, v]) =>
              k.toLowerCase() !== 'requiere_confirmacion' &&
              String(v).toLowerCase().includes(terminoBusqueda)
          );

        if (!matchBusqueda) return false;
      }

      return Object.entries(filtrosActivos).every(([key, valores]) => {
        if (key === llaveAIgnorar || !valores || valores.length === 0) return true;

        if (key === 'marca') {
          return valores.some((v) => prod.marca.toLowerCase() === v.toLowerCase());
        }

        if (key === 'Categoría') {
          return valores.some(
            (v) => (prod.categoria || '').toLowerCase() === v.toLowerCase()
          );
        }

        const specValue = getSpecValue(prod.especificaciones_tecnicas, key);
        if (specValue === undefined || specValue === null) return false;
        return valores.some((v) => String(specValue).toLowerCase() === v.toLowerCase());
      });
    };

    // Filtrar productos que cumplen todo
    const filtrados = productosBase.filter((prod) => cumpleFiltrosCruzados(prod));

    // Ordenar copia
    if (orden === 'precio_asc') {
      filtrados.sort((a, b) => a.precio_venta - b.precio_venta);
    } else if (orden === 'precio_desc') {
      filtrados.sort((a, b) => b.precio_venta - a.precio_venta);
    } else {
      filtrados.sort(
        (a, b) =>
          a.marca.localeCompare(b.marca) ||
          a.numero_parte.localeCompare(b.numero_parte)
      );
    }

    // Marcas disponibles (ignorando filtro 'marca')
    const marcasUnicas = new Set<string>();
    productosBase.forEach((prod) => {
      if (cumpleFiltrosCruzados(prod, 'marca')) {
        marcasUnicas.add(prod.marca);
      }
    });

    // Determinar campos de filtro de la categoría activa (o Todas)
    let camposParaFiltrar: CampoFiltro[] = [];
    if (categoriaActiva) {
      const cat = categorias.find(
        (c) => c.nombre.toLowerCase() === categoriaActiva.toLowerCase()
      );
      camposParaFiltrar = (cat?.campos_filtro || []).filter(
        (c) => c.visible_en_filtros !== false
      );
    } else {
      const allowedKeys = new Set<string>();
      categorias.forEach((cat) => {
        (cat.campos_filtro || []).forEach((c) => {
          if (c.visible_en_filtros !== false) allowedKeys.add(c.nombre);
        });
      });

      const clavesUnicas = new Set<string>();
      productosBase.forEach((prod) => {
        if (prod.especificaciones_tecnicas) {
          Object.keys(prod.especificaciones_tecnicas).forEach((k) => {
            if (allowedKeys.has(k)) clavesUnicas.add(k);
          });
        }
      });

      camposParaFiltrar = [
        { nombre: 'Categoría', tipo: 'seleccion' as const, opciones: [] },
        ...Array.from(clavesUnicas)
          .sort()
          .map((k) => ({
            nombre: k,
            tipo: 'seleccion' as const,
            opciones: [],
          })),
      ];
    }

    // Extraer opciones dinámicas por campo
    const opcionesExtraidas: Record<string, string[]> = {};
    camposParaFiltrar.forEach((campo) => {
      const valoresUnicos = new Set<string>();
      productosBase.forEach((prod) => {
        if (cumpleFiltrosCruzados(prod, campo.nombre)) {
          if (campo.nombre === 'Categoría') {
            if (prod.categoria) valoresUnicos.add(prod.categoria);
          } else {
            const specValue = getSpecValue(
              prod.especificaciones_tecnicas,
              campo.nombre
            );
            if (specValue !== undefined && specValue !== null) {
              valoresUnicos.add(String(specValue));
            }
          }
        }
      });
      opcionesExtraidas[campo.nombre] = Array.from(valoresUnicos).sort();
    });

    return {
      productos: filtrados,
      marcasDisponibles: Array.from(marcasUnicas).sort(),
      camposFiltro: camposParaFiltrar,
      opcionesDinamicas: opcionesExtraidas,
    };
  }, [productosBase, busqueda, filtrosActivos, orden, categoriaActiva, categorias]);

  // Reiniciar a página 1 cuando cambian filtros, búsqueda o categoría
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtrosActivos, categoriaActiva, orden]);

  // Auto-seleccionar filtros coincidentes desde la búsqueda cuando coincide exactamente con una opción/marca
  useEffect(() => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda || autoCheckDone.current || productosBase.length === 0) {
      return;
    }

    const nuevosChecks: Record<string, string[]> = { ...filtrosActivos };
    let huboCoincidencia = false;

    camposFiltro.forEach((campo) => {
      const opciones = opcionesDinamicas[campo.nombre] || [];
      opciones.forEach((op) => {
        if (op.toLowerCase() === terminoBusqueda) {
          const actuales = nuevosChecks[campo.nombre] || [];
          if (!actuales.includes(op)) {
            nuevosChecks[campo.nombre] = [...actuales, op];
            huboCoincidencia = true;
          }
        }
      });
    });

    marcasDisponibles.forEach((marca) => {
      if (marca.toLowerCase() === terminoBusqueda) {
        const actuales = nuevosChecks['marca'] || [];
        if (!actuales.includes(marca)) {
          nuevosChecks['marca'] = [...actuales, marca];
          huboCoincidencia = true;
        }
      }
    });

    if (huboCoincidencia) {
      autoCheckDone.current = true;
      setFiltrosActivos(nuevosChecks);
      setBusqueda('');
    }
  }, [busqueda, camposFiltro, opcionesDinamicas, marcasDisponibles, filtrosActivos, productosBase.length]);

  const handleFiltroChange = (nombre: string, valor: string) => {
    setFiltrosActivos((prev) => {
      const actuales = prev[nombre] || [];
      const yaExiste = actuales.includes(valor);

      if (yaExiste) {
        const nuevos = actuales.filter((v) => v !== valor);
        if (nuevos.length === 0) {
          const next = { ...prev };
          delete next[nombre];
          return next;
        }
        return { ...prev, [nombre]: nuevos };
      } else {
        return { ...prev, [nombre]: [...actuales, valor] };
      }
    });
  };

  const renderPagination = (isTop: boolean = false) => {
    if (isTop) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-slate-300 pb-6 mb-4">
          <div className="text-sm text-slate-600 font-medium">
            {productos.length > 0 ? (
              <>
                Mostrando{' '}
                <span className="font-extrabold text-slate-900">
                  {(paginaActual - 1) * 50 + 1}
                </span>{' '}
                a{' '}
                <span className="font-extrabold text-slate-900">
                  {Math.min(paginaActual * 50, productos.length)}
                </span>{' '}
                de{' '}
                <span className="font-extrabold text-slate-900">
                  {productos.length}
                </span>{' '}
                resultados
              </>
            ) : (
              <span>No se encontraron resultados</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">Ordenar por:</span>
            <select
              value={orden}
              onChange={(e) => {
                setOrden(e.target.value);
                setPaginaActual(1);
              }}
              className="border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 rounded-xl text-sm font-bold text-slate-900 py-2 pl-3.5 pr-8 bg-white shadow-sm transition-all focus:outline-none cursor-pointer"
            >
              <option value="relevancia">Relevancia</option>
              <option value="precio_asc">Precio: Menor a Mayor</option>
              <option value="precio_desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      );
    }

    if (productos.length <= 50) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t-2 border-slate-300 pt-6 mt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPaginaActual((prev) => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={paginaActual === 1}
            className="px-4 py-2 border-2 border-slate-300 hover:border-slate-400 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Anterior
          </button>

          <div className="hidden md:flex items-center gap-1">
            {Array.from({ length: Math.ceil(productos.length / 50) }).map(
              (_, i) => {
                const p = i + 1;
                const totalPages = Math.ceil(productos.length / 50);

                if (totalPages > 7) {
                  if (
                    p !== 1 &&
                    p !== totalPages &&
                    Math.abs(p - paginaActual) > 1
                  ) {
                    if (p === paginaActual - 2 || p === paginaActual + 2) {
                      return (
                        <span key={p} className="px-2 text-slate-500 font-bold">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                }

                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPaginaActual(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      paginaActual === p
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-800 hover:bg-slate-200 border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => {
              setPaginaActual((prev) =>
                Math.min(prev + 1, Math.ceil(productos.length / 50))
              );
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={paginaActual === Math.ceil(productos.length / 50)}
            className="px-4 py-2 border-2 border-slate-300 hover:border-slate-400 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Siguiente
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-100 pt-28 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Título y búsqueda */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold text-slate-900">
                Catálogo de Herramientas
              </h1>
              <button
                type="button"
                onClick={() => setMostrarCargaRapida(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-brand-50 text-brand-700 border-2 border-brand-200 font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                Carga Rápida (Pegar desde Excel)
              </button>
            </div>
            <SearchBar
              onSearch={(q) => {
                setBusqueda(q);
                autoCheckDone.current = false;
              }}
              initialValue={busqueda}
            />
          </div>

          {/* Categorías (Píldoras) */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => {
                setCategoriaActiva(null);
                setFiltrosActivos({});
                setBusqueda('');
                autoCheckDone.current = false;
                window.history.pushState(null, '', '/catalogo');
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                categoriaActiva === null
                  ? 'bg-brand-700 text-white shadow-md border-2 border-brand-700'
                  : 'bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 border-2 border-slate-300 shadow-sm'
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoriaActiva(cat.nombre);
                  setFiltrosActivos({});
                  setBusqueda('');
                  autoCheckDone.current = false;
                  window.history.pushState(
                    null,
                    '',
                    `/catalogo?categoria=${encodeURIComponent(cat.nombre)}`
                  );
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  categoriaActiva?.toLowerCase() === cat.nombre.toLowerCase()
                    ? 'bg-brand-700 text-white shadow-md border-2 border-brand-700'
                    : 'bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400 border-2 border-slate-300 shadow-sm'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Chips de Filtros Activos */}
          {(Object.keys(filtrosActivos).length > 0 || busqueda) && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">
                Filtros:
              </span>
              {busqueda && (
                <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-800 border-2 border-brand-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  Búsqueda: &quot;{busqueda}&quot;
                  <button
                    onClick={() => {
                      setBusqueda('');
                      autoCheckDone.current = false;
                    }}
                    className="ml-1 text-brand-600 hover:text-brand-900 font-bold text-sm"
                  >
                    ×
                  </button>
                </span>
              )}
              {Object.entries(filtrosActivos).map(([key, valores]) =>
                valores.map((v) => (
                  <span
                    key={`${key}-${v}`}
                    className="inline-flex items-center gap-1.5 bg-white text-slate-900 border-2 border-slate-300 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                  >
                    {key.replace(/_/g, ' ')}: {v}
                    <button
                      onClick={() => handleFiltroChange(key, v)}
                      className="ml-1 text-slate-500 hover:text-slate-900 font-bold text-sm"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
              <button
                onClick={() => {
                  setFiltrosActivos({});
                  setBusqueda('');
                  autoCheckDone.current = false;
                }}
                className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider ml-2 hover:underline"
              >
                Limpiar Todo
              </button>
            </div>
          )}

          {/* Contenido: Filtros + Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {camposFiltro.length > 0 && (
              <FilterSidebar
                campos={camposFiltro}
                filtrosActivos={filtrosActivos}
                onFiltroChange={handleFiltroChange}
                onLimpiarFiltros={() => {
                  setFiltrosActivos({});
                  setBusqueda('');
                  autoCheckDone.current = false;
                }}
                marcas={marcasDisponibles}
                opcionesDinamicas={opcionesDinamicas}
              />
            )}

            {/* Grid de Productos */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {renderPagination(true)}

                  <ProductGrid
                    productos={productos.slice(
                      (paginaActual - 1) * 50,
                      paginaActual * 50
                    )}
                    marcasLogos={marcasLogos}
                    isB2B={isB2B}
                  />

                  {renderPagination(false)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CargaRapidaModal
        isOpen={mostrarCargaRapida}
        onClose={() => setMostrarCargaRapida(false)}
      />
    </>
  );
}
