'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductGrid from '@/components/catalogo/ProductGrid';
import SearchBar from '@/components/catalogo/SearchBar';
import FilterSidebar from '@/components/catalogo/FilterSidebar';
import { supabase } from '@/lib/supabase/client';
import { calcularPrecioVenta } from '@/lib/pricing/engine';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import type { Producto, ProductoConPrecio, Categoria, CampoFiltro } from '@/types';

export default function CatalogoPage() {
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, string[]>>({});
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('relevancia');
  const [loading, setLoading] = useState(true);
  const [tipoCambio, setTipoCambio] = useState(20.0);
  const [camposFiltro, setCamposFiltro] = useState<CampoFiltro[]>([]);
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [opcionesDinamicas, setOpcionesDinamicas] = useState<Record<string, string[]>>({});

  // Moneda de venta por defecto MXN
  const monedaVenta = 'MXN' as const;

  // Cargar categorías al montar
  useEffect(() => {
    async function cargarCategorias() {
      const { data } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (data) setCategorias(data as Categoria[]);
    }
    cargarCategorias();

    // Leer la categoría y búsqueda inicial de la URL
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
    }

    // Obtener tipo de cambio
    obtenerTipoCambio().then((tc) => setTipoCambio(tc.valor));
  }, []);

  // Cargar productos cuando cambian filtros
  useEffect(() => {
    async function cargarProductos() {
      setLoading(true);

      let query = supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('marca')
        .limit(2500); // Aumentado para filtrado profundo en cliente

      // Filtro por categoría (único filtro estricto en servidor)
      if (categoriaActiva) {
        query = query.eq('categoria', categoriaActiva);
      }

      // La búsqueda profunda ahora se hace en el cliente para abarcar descripciones
      const { data, error } = await query;

      if (error) {
        console.error('Error cargando productos:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Calcular precios de venta
        const productosConPrecio: ProductoConPrecio[] = (data as Producto[]).map((prod) => {
          const resultado = calcularPrecioVenta(
            prod.costo_base,
            prod.moneda_costo,
            monedaVenta,
            tipoCambio
          );
          return {
            ...prod,
            precio_venta: resultado.precioVenta,
            moneda_venta: resultado.monedaVenta,
            formula_aplicada: resultado.formulaAplicada,
          };
        });

        const terminoBusqueda = busqueda.toLowerCase().trim();

        // Helper para evaluar si un producto cumple con los filtros activos y búsqueda
        const cumpleFiltrosCruzados = (prod: ProductoConPrecio, llaveAIgnorar: string | null = null) => {
          // 1. Búsqueda profunda (Texto)
          if (terminoBusqueda) {
             const descFormateada = formatearDescripcionProducto(prod as any).toLowerCase();
             const matchBusqueda = 
                (prod.numero_parte?.toLowerCase().includes(terminoBusqueda) || false) ||
                (prod.marca?.toLowerCase().includes(terminoBusqueda) || false) ||
                (prod.categoria?.toLowerCase().includes(terminoBusqueda) || false) ||
                (prod.sku_interno?.toLowerCase().includes(terminoBusqueda) || false) ||
                descFormateada.includes(terminoBusqueda);
                
             if (!matchBusqueda) return false;
          }

          // 2. Filtros dinámicos de sidebar
          return Object.entries(filtrosActivos).every(([key, valores]) => {
            if (key === llaveAIgnorar || !valores || valores.length === 0) return true;
            
            if (key === 'marca') {
              return valores.some(v => prod.marca.toLowerCase() === v.toLowerCase());
            }

            const specValue = prod.especificaciones_tecnicas?.[key];
            if (!specValue) return false;
            return valores.some(v => String(specValue).toLowerCase() === v.toLowerCase());
          });
        };

        // 1. Filtrar productos finales (se muestran en el grid)
        let productosFiltrados = productosConPrecio.filter(prod => cumpleFiltrosCruzados(prod));
        
        // 1.5 Aplicar ordenamiento
        if (orden === 'precio_asc') {
          productosFiltrados.sort((a, b) => a.precio_venta - b.precio_venta);
        } else if (orden === 'precio_desc') {
          productosFiltrados.sort((a, b) => b.precio_venta - a.precio_venta);
        } else {
          productosFiltrados.sort((a, b) => a.marca.localeCompare(b.marca) || a.numero_parte.localeCompare(b.numero_parte));
        }

        setProductos(productosFiltrados);
        setPaginaActual(1);

        // 2. Extraer marcas únicas (Filtro cruzado: ignoramos el filtro de marca actual)
        const marcasUnicas = new Set<string>();
        productosConPrecio.forEach(prod => {
          if (cumpleFiltrosCruzados(prod, 'marca')) {
            marcasUnicas.add(prod.marca);
          }
        });
        setMarcasDisponibles(Array.from(marcasUnicas).sort());
        
        // 3. Extraer opciones dinámicas en cascada (Filtros cruzados)
        const opcionesExtraidas: Record<string, string[]> = {};
        if (categoriaActiva) {
          const cat = categorias.find((c) => c.nombre === categoriaActiva);
          if (cat && cat.campos_filtro) {
            cat.campos_filtro.forEach(campo => {
              const valoresUnicos = new Set<string>();
              productosConPrecio.forEach(prod => {
                // Evaluamos si el producto cumple con TODOS los demás filtros
                if (cumpleFiltrosCruzados(prod, campo.nombre)) {
                  if (prod.especificaciones_tecnicas && prod.especificaciones_tecnicas[campo.nombre]) {
                    valoresUnicos.add(String(prod.especificaciones_tecnicas[campo.nombre]));
                  }
                }
              });
              opcionesExtraidas[campo.nombre] = Array.from(valoresUnicos).sort();
            });
          }
        }
        setOpcionesDinamicas(opcionesExtraidas);
      }

      setLoading(false);
    }

    cargarProductos();
  }, [categoriaActiva, busqueda, filtrosActivos, tipoCambio, monedaVenta, categorias, orden]);

  // Actualizar campos de filtro cuando cambia la categoría
  useEffect(() => {
    if (categoriaActiva) {
      const cat = categorias.find((c) => c.nombre === categoriaActiva);
      setCamposFiltro(cat?.campos_filtro || []);
    } else {
      setCamposFiltro([]);
    }
  }, [categoriaActiva, categorias]);

  const handleFiltroChange = (nombre: string, valor: string) => {
    setFiltrosActivos((prev) => {
      const actuales = prev[nombre] || [];
      const yaExiste = actuales.includes(valor);
      
      if (yaExiste) {
        // Toggle off: quitar del array
        const nuevos = actuales.filter(v => v !== valor);
        if (nuevos.length === 0) {
          const next = { ...prev };
          delete next[nombre];
          return next;
        }
        return { ...prev, [nombre]: nuevos };
      } else {
        // Toggle on: agregar al array
        return { ...prev, [nombre]: [...actuales, valor] };
        }
      });
    };

    const renderPagination = (isTop: boolean = false) => {
    if (isTop) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-2">
          <div className="text-sm text-gray-500">
            {productos.length > 0 ? (
              <>Mostrando <span className="font-bold text-gray-900">{((paginaActual - 1) * 50) + 1}</span> a <span className="font-bold text-gray-900">{Math.min(paginaActual * 50, productos.length)}</span> de <span className="font-bold text-gray-900">{productos.length}</span> resultados</>
            ) : (
              <span>No se encontraron resultados</span>
            )}
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
             <select 
               value={orden} 
               onChange={(e) => { setOrden(e.target.value); setPaginaActual(1); }} 
               className="border border-gray-300 rounded-lg text-sm text-gray-700 py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white"
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
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-gray-200 pt-6 mt-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setPaginaActual(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={paginaActual === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
            
            <div className="hidden md:flex items-center gap-1">
              {Array.from({ length: Math.ceil(productos.length / 50) }).map((_, i) => {
                const p = i + 1;
                const totalPages = Math.ceil(productos.length / 50);
                
                if (totalPages > 7) {
                  if (
                    p !== 1 && 
                    p !== totalPages &&
                    Math.abs(p - paginaActual) > 1
                  ) {
                    if (p === paginaActual - 2 || p === paginaActual + 2) {
                      return <span key={p} className="px-2 text-gray-400">...</span>;
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
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      paginaActual === p 
                        ? 'bg-brand-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => {
                setPaginaActual(prev => Math.min(prev + 1, Math.ceil(productos.length / 50)));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={paginaActual === Math.ceil(productos.length / 50)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <main className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Título y búsqueda */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Catálogo de Herramientas</h1>
            <SearchBar onSearch={setBusqueda} />
          </div>

          {/* Categorías (Píldoras) */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => {
                setCategoriaActiva(null);
                setFiltrosActivos({});
                window.history.pushState(null, '', '/catalogo');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                categoriaActiva === null
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                  window.history.pushState(null, '', `/catalogo?categoria=${encodeURIComponent(cat.nombre)}`);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoriaActiva === cat.nombre
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {/* Contenido: Filtros + Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar de filtros (solo si hay categoría seleccionada) */}
            {categoriaActiva && camposFiltro.length > 0 && (
              <FilterSidebar
                campos={camposFiltro}
                filtrosActivos={filtrosActivos}
                onFiltroChange={handleFiltroChange}
                onLimpiarFiltros={() => setFiltrosActivos({})}
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
                  
                  <ProductGrid productos={productos.slice((paginaActual - 1) * 50, paginaActual * 50)} />
                  
                  {renderPagination(false)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
