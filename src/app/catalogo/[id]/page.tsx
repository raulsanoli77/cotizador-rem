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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [producto, setProducto] = useState<ProductoConPrecio | null>(null);
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
        } as ProductoConPrecio);
      } catch (error) {
        console.error('Error al cargar producto:', error);
        router.push('/catalogo');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Botón de Regresar */}
        <Link 
          href="/catalogo" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-brand-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        {/* Contenedor Principal (Dark/Light híbrido) */}
        <div className="w-full bg-slate-900 shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Lado Izquierdo: Imagen Blanca */}
          <div className="w-full md:w-5/12 bg-white p-8 md:p-12 flex items-center justify-center border-r border-slate-800 shrink-0">
            {producto.imagen_url ? (
              <img 
                src={producto.imagen_url} 
                alt={producto.numero_parte} 
                className="max-h-96 max-w-full object-contain drop-shadow-xl" 
              />
            ) : (
              <div className="text-slate-300 text-center flex flex-col items-center">
                <ShoppingCart className="h-32 w-32 mb-4 opacity-50" />
                <span className="text-sm font-semibold uppercase tracking-widest">Fotografía Pendiente</span>
              </div>
            )}
          </div>

          {/* Lado Derecho: Info Técnica */}
          <div className="flex-1 flex flex-col">
            <div className="p-8 md:p-12 flex-1">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                <span>Catálogo</span>
                <ChevronRight className="h-3 w-3" />
                <span>{producto.categoria}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-brand-500">{producto.marca}</span>
              </div>

              {/* Título Gigante */}
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                {producto.numero_parte}
              </h1>

              {/* Resumen */}
              <p className="text-slate-400 text-base mb-10 leading-relaxed max-w-xl">
                {formatearDescripcionProducto(producto)}
              </p>

              {/* Área de Compra */}
              <div className="bg-slate-800/50 border border-slate-700/50 p-6 md:p-8 rounded-lg mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Precio Unitario</p>
                  <div className="text-4xl font-black text-white flex items-baseline gap-2">
                    {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
                    <span className="text-lg font-medium text-slate-500 uppercase">{producto.moneda_venta}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md">
                    <button 
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="p-4 text-slate-400 hover:text-white transition-colors"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-12 text-center text-xl font-bold text-white">{cantidad}</span>
                    <button 
                      onClick={() => setCantidad(cantidad + 1)}
                      className="p-4 text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleAdd}
                    className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-md font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" /> Agregar
                  </button>
                </div>
              </div>

              {/* Atributos Técnicos */}
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-800 pb-4 mb-6">
                  Especificaciones Técnicas
                </h3>
                
                {specsEntries.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {specsEntries.map(([key, value]) => (
                      <div key={key} className="bg-slate-800/30 border border-slate-800 p-4 rounded-lg flex flex-col">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{key}</span>
                        <span className="text-sm md:text-base font-medium text-slate-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No hay especificaciones adicionales registradas para este producto.</p>
                )}
              </div>
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
