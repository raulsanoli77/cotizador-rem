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
import type { Producto, ProductoConPrecio, Categoria, CampoFiltro } from '@/types';

export default function CatalogoPage() {
  const [productos, setProductos] = useState<ProductoConPrecio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, string | number | null>>({});
  const [busqueda, setBusqueda] = useState('');
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
        .limit(500); // Aumentado para mejor filtrado en cliente

      // Filtro por categoría (único filtro estricto en servidor)
      if (categoriaActiva) {
        query = query.eq('categoria', categoriaActiva);
      }

      // Búsqueda por texto (servidor)
      if (busqueda) {
        query = query.or(
          `numero_parte.ilike.%${busqueda}%,marca.ilike.%${busqueda}%,categoria.ilike.%${busqueda}%`
        );
      }

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

        // Helper para evaluar si un producto cumple con los filtros activos (saltándose uno en específico para lógica cruzada)
        const cumpleFiltrosCruzados = (prod: ProductoConPrecio, llaveAIgnorar: string | null = null) => {
          return Object.entries(filtrosActivos).every(([key, value]) => {
            if (key === llaveAIgnorar || !value) return true;
            
            if (key === 'marca') {
              return prod.marca.toLowerCase() === String(value).toLowerCase();
            }

            const specValue = prod.especificaciones_tecnicas?.[key];
            if (!specValue) return false;
            return String(specValue).toLowerCase() === String(value).toLowerCase();
          });
        };

        // 1. Filtrar productos finales (se muestran en el grid)
        const productosFiltrados = productosConPrecio.filter(prod => cumpleFiltrosCruzados(prod));
        setProductos(productosFiltrados);

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
  }, [categoriaActiva, busqueda, filtrosActivos, tipoCambio, monedaVenta, categorias]);

  // Actualizar campos de filtro cuando cambia la categoría
  useEffect(() => {
    if (categoriaActiva) {
      const cat = categorias.find((c) => c.nombre === categoriaActiva);
      setCamposFiltro(cat?.campos_filtro || []);
    } else {
      setCamposFiltro([]);
    }
  }, [categoriaActiva, categorias]);

  const handleFiltroChange = (nombre: string, valor: string | number | null) => {
    setFiltrosActivos((prev) => {
      if (valor === null) {
        const next = { ...prev };
        delete next[nombre];
        return next;
      }
      return { ...prev, [nombre]: valor };
    });
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

          {/* Categorías */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setCategoriaActiva(null); setFiltrosActivos({}); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !categoriaActiva
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoriaActiva(cat.nombre); setFiltrosActivos({}); }}
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

            {/* Grid de productos */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
                </div>
              ) : (
                <ProductGrid productos={productos} />
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
