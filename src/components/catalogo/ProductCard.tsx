'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import type { ProductoConPrecio } from '@/types/product';
import { formatearPrecio } from '@/lib/pricing/engine';
import { useCartStore } from '@/stores/cart-store';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import Link from 'next/link';

interface ProductCardProps {
  producto: ProductoConPrecio;
  marcaLogoUrl?: string;
  isB2B?: boolean;
}

export default function ProductCard({ producto, marcaLogoUrl, isB2B = false }: ProductCardProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const [cantidad, setCantidad] = useState(1);
  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Si no es B2B, el precio a agregar es el precio_publico
    const productoAgregado = !isB2B && producto.precio_publico 
      ? { ...producto, precio_venta: producto.precio_publico }
      : producto;
      
    agregarItem(productoAgregado, cantidad);
    setCantidad(1); // reset after adding
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-slate-300 hover:border-slate-400 overflow-hidden group flex flex-col h-full">
      {/* Imagen (Clicable) - Área grande superior */}
      <Link 
        href={`/catalogo/${producto.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full aspect-[5/4] bg-slate-50/70 flex items-center justify-center p-4 border-b-2 border-slate-200 group-hover:bg-white transition-colors cursor-pointer overflow-hidden block"
      >
        {/* Etiqueta de Marca Flotante */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm shadow-sm border-2 border-slate-200 px-2.5 py-1 rounded-lg z-10 flex items-center justify-center">
          {marcaLogoUrl ? (
            <img src={marcaLogoUrl} alt={producto.marca} className="h-4 w-auto object-contain mix-blend-multiply" />
          ) : (
            <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">{producto.marca}</span>
          )}
        </div>
        
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.numero_parte} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <ShoppingCart className="h-16 w-16 text-slate-300" />
        )}
      </Link>

      {/* Info Principal */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mb-1">{producto.categoria}</span>
        <Link href={`/catalogo/${producto.id}`} className="text-left group-hover:text-brand-600 transition-colors mb-1 block">
          <h3 className="font-mono font-bold text-slate-900 text-base leading-tight truncate">{producto.numero_parte}</h3>
        </Link>
        <p className="text-xs text-slate-600 leading-snug line-clamp-3 mb-3 flex-1" title={formatearDescripcionProducto(producto)}>
          {formatearDescripcionProducto(producto)}
        </p>

        {/* Pie de Tarjeta: Precio Arriba, Controles Abajo */}
        <div className="mt-auto pt-3 border-t-2 border-slate-200 flex flex-col gap-2.5">
          {isB2B ? (
            <>
              <div className="flex flex-col mb-1">
                {producto.precio_publico && producto.precio_publico > producto.precio_venta && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-slate-400 line-through">
                      ${producto.precio_publico.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                      -{Math.round((1 - (producto.precio_venta / producto.precio_publico)) * 100)}%
                    </span>
                  </div>
                )}
                <div className="text-lg sm:text-xl font-black text-slate-900 leading-none truncate">
                  ${producto.precio_venta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-xs sm:text-sm text-slate-600 font-bold ml-1">{producto.moneda_venta}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-100/80 border-2 border-slate-200 rounded-xl p-2.5 text-center mb-1">
              {producto.precio_publico && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Precio de Lista</span>
                  <span className="text-base font-black text-slate-900">
                    ${producto.precio_publico.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {producto.moneda_venta}
                  </span>
                </div>
              )}
              <Link href="/admin/login" className="block w-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors shadow-sm">
                Ver precio de clientes
              </Link>
            </div>
          )}

          {/* ADD TO CART CONTROLS (SIEMPRE VISIBLES) */}
          <div className="flex gap-1.5 w-full mt-auto">
            <div className="flex items-center justify-between border-2 border-slate-300 rounded-xl bg-white w-[70px] shrink-0 shadow-sm">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidad(Math.max(1, cantidad - 1)); }}
                className="py-1.5 px-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-l-lg transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-bold text-slate-900">{cantidad}</span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidad(cantidad + 1); }}
                className="py-1.5 px-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-r-lg transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            
            <button 
              onClick={handleAdd}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-brand-600/20 py-2 px-1 overflow-hidden"
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-bold truncate">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
