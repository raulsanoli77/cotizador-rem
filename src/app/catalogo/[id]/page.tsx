'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import type { Producto, ProductoConPrecio } from '@/types';
import { formatearPrecio, calcularPrecioVenta } from '@/lib/pricing/engine';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import { useCartStore } from '@/stores/cart-store';
import { supabase } from '@/lib/supabase/client';
import { obtenerTipoCambio } from '@/lib/pricing/exchange-rate';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [producto, setProducto] = useState<ProductoConPrecio | null>(null);
  const [marcaLogoUrl, setMarcaLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const agregarItem = useCartStore((s) => s.agregarItem);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        // Obtener producto
        const { data: prodData, error } = await supabase
          .from('productos')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        if (!prodData) {
          router.push('/catalogo');
          return;
        }

        // Obtener logo de marca si existe
        const { data: configData } = await supabase.from('configuracion').select('valor').eq('clave', 'marcas_logos').single();
        if (configData?.valor && configData.valor[prodData.marca]) {
          setMarcaLogoUrl(configData.valor[prodData.marca]);
        }

        // Calcular precio final
        const tipoCambioCache = await obtenerTipoCambio();
        const resultado = calcularPrecioVenta(
          prodData.costo_base, 
          prodData.moneda_costo as any, 
          'MXN',
          tipoCambioCache.valor
        );

        setProducto({
          ...(prodData as Producto),
          precio_venta: resultado.precioVenta,
          moneda_venta: resultado.monedaVenta,
          formula_aplicada: resultado.formulaAplicada
        });
      } catch (err) {
        console.error('Error cargando producto:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-grow flex items-center justify-center pt-16">
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!producto) return null;

  const handleAdd = () => {
    agregarItem(producto, cantidad);
    setCantidad(1);
    alert('Producto agregado al carrito'); // Opcional: Toast sutil
  };

  const specs = producto.especificaciones_tecnicas || {};
  const specsEntries = Object.entries(specs);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-grow pt-16">
        
        {/* Sección Superior: Fondo Oscuro (Dark Industrial) */}
        <section className="bg-slate-900 pt-8 pb-16 lg:pb-24 shadow-inner border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Migas de Pan (Oscuras) */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
              <Link href="/catalogo" className="hover:text-brand-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Catálogo
              </Link>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span>{producto.categoria}</span>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-brand-500">{producto.marca}</span>
            </div>

            {/* Contenido Principal a 2 Columnas */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16 items-stretch">
              
              {/* Columna Izquierda: Imagen (Caja Blanca Inmersiva) */}
              <div className="w-full lg:w-1/2 flex items-center justify-center bg-white rounded-3xl p-8 lg:p-12 shadow-2xl relative">
                
                {/* Etiqueta de Marca Flotante */}
                <div className="absolute top-6 left-6 z-10">
                  {marcaLogoUrl ? (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-lg shadow-sm h-12 flex items-center" title={`Marca: ${producto.marca}`}>
                      <img src={marcaLogoUrl} alt={producto.marca} className="h-full object-contain mix-blend-multiply" />
                    </div>
                  ) : (
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider border border-slate-200 shadow-sm flex items-center h-12">
                      {producto.marca}
                    </span>
                  )}
                </div>

                {producto.imagen_url ? (
                  <img 
                    src={producto.imagen_url} 
                    alt={producto.numero_parte} 
                    className="max-h-[400px] w-auto object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" 
                  />
                ) : (
                  <div className="text-slate-300 text-center flex flex-col items-center">
                    <ShoppingCart className="h-32 w-32 mb-4 opacity-20" />
                    <span className="text-sm font-semibold uppercase tracking-widest">Fotografía Pendiente</span>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Información y Compra */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center text-white py-4">
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md tracking-wider">
                    SKU: {producto.sku_interno || producto.id.split('-')[0]}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-md">
                  {producto.numero_parte}
                </h1>

                <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed font-medium">
                  {formatearDescripcionProducto(producto)}
                </p>

                {/* Módulo de Compra (Caja de Contraste) */}
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700 mt-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Precio Unitario</p>
                      <div className="text-4xl font-black text-white flex items-baseline gap-2 drop-shadow-md">
                        {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
                        <span className="text-lg font-medium text-slate-400 uppercase">{producto.moneda_venta}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden w-full sm:w-auto shadow-inner">
                        <button 
                          onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                          className="p-4 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="w-16 text-center text-xl font-bold text-white">{cantidad}</span>
                        <button 
                          onClick={() => setCantidad(cantidad + 1)}
                          className="p-4 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleAdd}
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-5 w-5" /> Agregar al carrito
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Sección Inferior: Especificaciones Técnicas */}
        <section className="bg-slate-50 py-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-4">
              Especificaciones Técnicas
              <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
            </h3>
            
            {specsEntries.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {specsEntries.map(([key, value]) => (
                  <div key={key} className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col hover:border-brand-400 hover:shadow-md transition-all">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{key}</span>
                    <span className="text-base sm:text-lg font-bold text-slate-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-8 rounded-xl text-center shadow-sm">
                 <p className="text-slate-500 text-lg">No hay especificaciones adicionales registradas para este producto.</p>
              </div>
            )}
          </div>
        </section>
        
      </main>
      
      <Footer />
    </div>
  );
}
