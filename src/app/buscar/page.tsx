'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, ArrowRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase/client';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';

interface CategoriaResultado {
  nombre: string;
  imagen_url: string | null;
  cantidad: number;
}

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [resultados, setResultados] = useState<CategoriaResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);

  useEffect(() => {
    async function buscar() {
      if (!query.trim()) {
        setResultados([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const termino = query.toLowerCase().trim();

      // 1. Traer todos los productos activos
      const { data: productos, error } = await supabase
        .from('productos')
        .select('categoria, numero_parte, marca, sku_interno, especificaciones_tecnicas')
        .eq('activo', true)
        .limit(2500);

      if (error || !productos) {
        console.error('Error buscando:', error);
        setLoading(false);
        return;
      }

      // 2. Traer categorías para las imágenes
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('nombre, imagen_url');

      const imagenesMap: Record<string, string | null> = {};
      (categoriasData || []).forEach(c => {
        imagenesMap[c.nombre] = c.imagen_url;
      });

      // 3. Filtrar productos que coincidan con la búsqueda
      const conteoCategoria: Record<string, number> = {};
      let total = 0;

      productos.forEach((prod: any) => {
        const descFormateada = formatearDescripcionProducto(prod).toLowerCase();
        const coincide =
          (prod.numero_parte?.toLowerCase().includes(termino) || false) ||
          (prod.marca?.toLowerCase().includes(termino) || false) ||
          (prod.categoria?.toLowerCase().includes(termino) || false) ||
          (prod.sku_interno?.toLowerCase().includes(termino) || false) ||
          descFormateada.includes(termino);

        // También buscar en especificaciones técnicas
        let specMatch = false;
        if (prod.especificaciones_tecnicas) {
          specMatch = Object.values(prod.especificaciones_tecnicas).some(
            (v: any) => String(v).toLowerCase().includes(termino)
          );
        }

        if (coincide || specMatch) {
          const cat = prod.categoria || 'Sin Categoría';
          conteoCategoria[cat] = (conteoCategoria[cat] || 0) + 1;
          total++;
        }
      });

      // 4. Convertir a array ordenado por cantidad descendente
      const categoriasResultado: CategoriaResultado[] = Object.entries(conteoCategoria)
        .map(([nombre, cantidad]) => ({
          nombre,
          imagen_url: imagenesMap[nombre] || null,
          cantidad,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);

      setResultados(categoriasResultado);
      setTotalProductos(total);
      setLoading(false);
    }

    buscar();
  }, [query]);

  const getImageUrl = (cat: CategoriaResultado) => {
    if (cat.imagen_url) return cat.imagen_url;
    const safeName = cat.nombre.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `/categorias/${safeName}.png`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />

      <main className="flex-grow pt-16">
        {/* Banner Superior */}
        <section className="bg-slate-900 border-b border-slate-800 py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <Search className="h-10 w-10 text-brand-500 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              Resultados de Búsqueda
            </h1>
            {query && (
              <p className="text-slate-400 text-lg">
                Categorías con productos que coinciden con{' '}
                <span className="text-brand-400 font-bold">&quot;{query}&quot;</span>
              </p>
            )}
          </div>
        </section>

        {/* Resultados */}
        <section className="py-12 px-4 bg-slate-900 min-h-[400px]">
          <div className="max-w-5xl mx-auto">

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-brand-500 mb-4" />
                <p className="text-slate-400 font-medium">Buscando en el catálogo...</p>
              </div>
            ) : !query.trim() ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-white mb-3">Escribe algo para buscar</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Ingresa una medida, material, recubrimiento o cualquier término técnico para encontrar las categorías que lo contienen.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Ir al Catálogo Completo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-white mb-3">Sin coincidencias</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  No encontramos productos que coincidan con <strong className="text-white">&quot;{query}&quot;</strong> en ninguna categoría. Intenta con otro término o explora el catálogo completo.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Explorar Catálogo Completo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Resumen */}
                <div className="mb-8 text-center">
                  <p className="text-slate-400">
                    <span className="text-white font-bold">{totalProductos}</span> productos encontrados en{' '}
                    <span className="text-white font-bold">{resultados.length}</span> categoría{resultados.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grid de Categorías */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resultados.map((cat) => (
                    <Link
                      key={cat.nombre}
                      href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}`}
                      className="group relative flex flex-col bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]"
                    >
                      {/* Imagen */}
                      <div className="aspect-[4/3] w-full relative bg-slate-800 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(cat)}
                          alt={cat.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        
                        {/* Badge de cantidad */}
                        <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          {cat.cantidad} {cat.cantidad === 1 ? 'producto' : 'productos'}
                        </div>
                      </div>

                      {/* Pie de tarjeta */}
                      <div className="p-5 border-t border-slate-700/50 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-brand-400 transition-colors">
                            {cat.nombre}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Coincidencias con &quot;{query}&quot;
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Botón de explorar todo */}
                <div className="mt-12 text-center">
                  <Link
                    href="/catalogo"
                    className="inline-flex items-center gap-2 border border-slate-600 hover:border-brand-500 text-slate-300 hover:text-white px-6 py-3 rounded-full transition-colors font-medium"
                  >
                    Ver todo el catálogo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
