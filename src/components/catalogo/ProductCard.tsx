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
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{producto.categoria}</span>
        <Link href={`/catalogo/${producto.id}`} className="text-left group-hover:text-brand-600 transition-colors mb-1 block">
          <h3 className="font-mono font-bold text-slate-900 text-base leading-tight truncate">{producto.numero_parte}</h3>
        </Link>
        <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-4 flex-1" title={formatearDescripcionProducto(producto)}>
          {formatearDescripcionProducto(producto)}
        </p>

        {/* Pie de Tarjeta: Precio y Acciones Fijas al fondo */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xl font-black text-slate-900 leading-none truncate">
              {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
            </div>
            
            <div className="flex items-center justify-between border border-slate-200 rounded-lg bg-slate-50 w-[76px] shrink-0">
              <button 
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-semibold text-slate-700">{cantidad}</span>
              <button 
                onClick={() => setCantidad(cantidad + 1)}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleAdd}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm py-2 px-4"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-bold">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
