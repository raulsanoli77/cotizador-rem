'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import type { ProductoConPrecio } from '@/types/product';
import { formatearPrecio } from '@/lib/pricing/engine';
import { useCartStore } from '@/stores/cart-store';
import { formatearDescripcionProducto, obtenerMultiploVenta } from '@/lib/pricing/formatters';
import Link from 'next/link';

interface ProductCardProps {
  producto: ProductoConPrecio;
  marcaLogoUrl?: string;
  isB2B?: boolean;
}

export default function ProductCard({ producto, marcaLogoUrl, isB2B = false }: ProductCardProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const multiplo = obtenerMultiploVenta(producto);
  const [cantidad, setCantidad] = useState(multiplo);

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
    setCantidad(multiplo); // reset after adding
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
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider truncate">{producto.categoria}</span>
          {multiplo > 1 && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
              <Package className="h-2.5 w-2.5" /> Caja c/{multiplo}
            </span>
          )}
        </div>
        <Link href={`/catalogo/${producto.id}`} className="text-left group-hover:text-brand-600 transition-colors mb-1 block">
          <h3 className="font-mono font-bold text-slate-900 text-base leading-tight truncate">
            {producto.numero_parte}
          </h3>
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
                    <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                      ${producto.precio_publico.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 whitespace-nowrap">
                      -{Math.round((1 - (producto.precio_venta / producto.precio_publico)) * 100)}%
                    </span>
                  </div>
                )}
                <div className="flex items-baseline flex-wrap gap-x-1 gap-y-0.5 leading-none">
                  <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                    ${producto.precio_venta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase whitespace-nowrap">
                    {producto.moneda_venta}{multiplo > 1 ? '/pza' : ''}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-100/80 border-2 border-slate-200 rounded-xl p-2.5 text-center mb-1">
              {producto.precio_publico && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Precio de Lista {multiplo > 1 ? '(Por pza)' : ''}
                  </span>
                  <div className="flex items-baseline justify-center flex-wrap gap-1">
                    <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                      ${producto.precio_publico.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase whitespace-nowrap">
                      {producto.moneda_venta}
                    </span>
                  </div>
                </div>
              )}
              <Link href="/admin/login" className="block w-full bg-slate-900 hover:bg-black text-white text-[11px] font-bold py-1.5 rounded-lg transition-colors shadow-sm">
                Ver precio de clientes
              </Link>
            </div>
          )}

          {/* ADD TO CART CONTROLS (SIEMPRE VISIBLES) */}
          <div className="flex gap-1.5 w-full mt-auto">
            <div className="flex items-center justify-between border-2 border-slate-300 rounded-xl bg-white w-[60px] sm:w-[66px] shrink-0 shadow-sm px-0.5">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidad(Math.max(multiplo, cantidad - multiplo)); }}
                className="py-1 px-1 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-l-lg transition-colors"
                title={multiplo > 1 ? `Restar paquete de ${multiplo}` : 'Restar 1'}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-bold text-slate-900">{cantidad}</span>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidad(cantidad + multiplo); }}
                className="py-1 px-1 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-r-lg transition-colors"
                title={multiplo > 1 ? `Sumar paquete de ${multiplo}` : 'Sumar 1'}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            
            <button 
              onClick={handleAdd}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-md shadow-brand-600/20 py-2 px-2"
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-bold whitespace-nowrap">Agregar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
