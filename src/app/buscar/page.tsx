'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, ArrowRight, Loader2, Plus, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase/client';
import { buscarVistaPreviaRapida } from '@/app/catalogo/actions';
import { formatearPrecio } from '@/lib/pricing/engine';
import { obtenerMultiploVenta } from '@/lib/pricing/formatters';
import { useCartStore } from '@/stores/cart-store';
import type { ProductoConPrecio } from '@/types';

interface CategoriaResultado {
  nombre: string;
  imagen_url: string | null;
  cantidad: number;
}

type ProductoResultado = ProductoConPrecio & { descripcion_formateada: string };

export default function BuscarPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const agregarItem = useCartStore((s) => s.agregarItem);

  const [resultados, setResultados] = useState<CategoriaResultado[]>([]);
  const [productosDirectos, setProductosDirectos] = useState<ProductoResultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProductos, setTotalProductos] = useState(0);
  const [agregados, setAgregados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function buscar() {
      if (!query.trim() || query.trim().length < 2) {
        setResultados([]);
        setProductosDirectos([]);
        setTotalProductos(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await buscarVistaPreviaRapida(query.trim(), session?.access_token || null, 48);
        setResultados(res.categorias);
        setProductosDirectos(res.productos);
        setTotalProductos(res.totalCoincidencias);
      } catch (err) {
        console.error('Error buscando:', err);
      } finally {
        setLoading(false);
      }
    }

    buscar();
  }, [query]);

  const getImageUrl = (cat: CategoriaResultado) => {
    if (cat.imagen_url) return cat.imagen_url;
    const safeName = cat.nombre.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `/categorias/${safeName}.png`;
  };

  const handleAgregar = (e: React.MouseEvent, prod: ProductoResultado) => {
    e.preventDefault();
    e.stopPropagation();
    const multiplo = obtenerMultiploVenta(prod);
    agregarItem(prod, multiplo);
    setAgregados((prev) => ({ ...prev, [prod.id]: true }));
    setTimeout(() => {
      setAgregados((prev) => ({ ...prev, [prod.id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header />

      <main className="flex-grow pt-24">
        {/* Banner Superior */}
        <section className="bg-slate-900 border-b border-slate-800 py-10 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <Search className="h-10 w-10 text-brand-500 mx-auto mb-3" />
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              Resultados de Búsqueda
            </h1>
            {query && (
              <p className="text-slate-400 text-lg">
                Coincidencias para{' '}
                <span className="text-brand-400 font-bold">&quot;{query}&quot;</span>
              </p>
            )}
          </div>
        </section>

        {/* Resultados */}
        <section className="py-10 px-4 bg-slate-900 min-h-[400px]">
          <div className="max-w-6xl mx-auto space-y-12">

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
                  Ingresa un código de parte, medida, material, recubrimiento o cualquier término técnico.
                </p>
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Ir al Catálogo Completo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : productosDirectos.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-slate-700 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-white mb-3">Sin coincidencias</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  No encontramos productos que coincidan con <strong className="text-white">&quot;{query}&quot;</strong>. Intenta con otro término o explora el catálogo completo.
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
                <div className="text-center">
                  <p className="text-slate-400">
                    <span className="text-white font-bold">{totalProductos}</span> {totalProductos === 1 ? 'producto encontrado' : 'productos encontrados'} en{' '}
                    <span className="text-white font-bold">{resultados.length}</span> categoría{resultados.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Categorías Coincidentes */}
                {resultados.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      Categorías Relacionadas
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {resultados.map((cat) => (
                        <Link
                          key={cat.nombre}
                          href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                          className="group relative flex flex-col bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]"
                        >
                          <div className="aspect-[16/10] w-full relative bg-slate-800 overflow-hidden flex items-center justify-center">
                            <Package className="absolute h-12 w-12 text-slate-700" />
                            <img
                              src={getImageUrl(cat)}
                              alt={cat.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2.5 right-2.5 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg z-20">
                              {cat.cantidad} {cat.cantidad === 1 ? 'prod.' : 'prods.'}
                            </div>
                          </div>

                          <div className="p-4 border-t border-slate-700/50 flex items-center justify-between z-20 bg-slate-800">
                            <div>
                              <h3 className="font-bold text-base text-white group-hover:text-brand-400 transition-colors">
                                {cat.nombre}
                              </h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Filtrar en categoría
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista Directa de Productos */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-4">
                    Productos Encontrados ({productosDirectos.length}{totalProductos > productosDirectos.length ? ` de ${totalProductos}` : ''})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productosDirectos.map((prod) => {
                      const recienAgregado = Boolean(agregados[prod.id]);
                      const multiplo = obtenerMultiploVenta(prod);

                      return (
                        <Link
                          key={prod.id}
                          href={`/catalogo/${prod.id}`}
                          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-16 h-16 rounded-xl bg-white border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                              {prod.imagen_url ? (
                                <img
                                  src={prod.imagen_url}
                                  alt={prod.numero_parte}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <Package className="w-7 h-7 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-base text-white group-hover:text-brand-400 transition-colors">
                                  {prod.numero_parte}
                                </span>
                                {prod.marca && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                    {prod.marca}
                                  </span>
                                )}
                                {prod.categoria && (
                                  <span className="text-xs font-semibold text-slate-400">
                                    • {prod.categoria}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-2 mt-1 font-medium">
                                {prod.descripcion_formateada}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-base font-black text-white">
                                {formatearPrecio(prod.precio_venta, prod.moneda_venta)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {prod.moneda_venta} + IVA {multiplo > 1 ? `(Paq. ${multiplo})` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleAgregar(e, prod)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                recienAgregado
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-brand-600 hover:bg-brand-500 text-white'
                              }`}
                            >
                              {recienAgregado ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Agregado
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  Cotizar
                                </>
                              )}
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Botón de explorar todo */}
                <div className="pt-4 text-center">
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
