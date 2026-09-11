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
}

export default function ProductCard({ producto, marcaLogoUrl }: ProductCardProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const [cantidad, setCantidad] = useState(1);
  
  const handleAdd = () => {
    agregarItem(producto, cantidad);
    setCantidad(1); // reset after adding
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden group flex flex-col h-full">
      {/* Imagen (Clicable) - Área grande superior */}
      <Link 
        href={`/catalogo/${producto.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-full aspect-[5/4] bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 group-hover:bg-white transition-colors cursor-pointer overflow-hidden block"
      >
        {/* Etiqueta de Marca Flotante */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm shadow-sm border border-slate-200 px-2 py-1 rounded z-10 flex items-center justify-center">
          {marcaLogoUrl ? (
            <img src={marcaLogoUrl} alt={producto.marca} className="h-4 w-auto object-contain mix-blend-multiply" />
          ) : (
            <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">{producto.marca}</span>
          )}
        </div>
        
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.numero_parte} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <ShoppingCart className="h-16 w-16 text-slate-200" />
        )}
      </Link>

      {/* Info Principal */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mb-1">{producto.categoria}</span>
        <Link href={`/catalogo/${producto.id}`} className="text-left group-hover:text-brand-600 transition-colors mb-1 block">
          <h3 className="font-mono font-bold text-slate-900 text-base leading-tight truncate">{producto.numero_parte}</h3>
        </Link>
        <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-3 flex-1" title={formatearDescripcionProducto(producto)}>
          {formatearDescripcionProducto(producto)}
        </p>

        {/* Pie de Tarjeta: Precio Arriba, Controles Abajo */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          
          <div className="text-lg sm:text-xl font-black text-slate-900 leading-none truncate">
            ${producto.precio_venta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs sm:text-sm text-slate-500 font-bold ml-1">{producto.moneda_venta}</span>
          </div>
          
          <div className="flex gap-1.5 w-full">
            <div className="flex items-center justify-between border border-slate-200 rounded-lg bg-slate-50 w-[64px] shrink-0">
              <button 
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="py-1.5 px-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-semibold text-slate-700">{cantidad}</span>
              <button 
                onClick={() => setCantidad(cantidad + 1)}
                className="py-1.5 px-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            
            <button 
              onClick={handleAdd}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center gap-1 transition-colors active:scale-95 shadow-sm py-1.5 px-1 overflow-hidden"
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
