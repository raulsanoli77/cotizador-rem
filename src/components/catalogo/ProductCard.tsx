'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import type { ProductoConPrecio } from '@/types/product';
import { formatearPrecio } from '@/lib/pricing/engine';
import { useCartStore } from '@/stores/cart-store';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';

interface ProductCardProps {
  producto: ProductoConPrecio;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const [cantidad, setCantidad] = useState(1);
  
  const handleAdd = () => {
    agregarItem(producto, cantidad);
    setCantidad(1); // reset after adding
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden group flex flex-col sm:flex-row items-center p-3 gap-4">
      {/* Imagen */}
      <div className="h-20 w-20 sm:h-16 sm:w-16 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center p-1">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.numero_parte} className="max-h-full max-w-full object-contain mix-blend-multiply" />
        ) : (
          <ShoppingCart className="h-6 w-6 text-slate-300" />
        )}
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{producto.marca}</span>
            <span className="text-[10px] text-slate-400 uppercase">{producto.categoria}</span>
          </div>
          <h3 className="font-mono font-bold text-slate-900 text-base mb-1 truncate">{producto.numero_parte}</h3>
          <p className="text-xs text-slate-500 leading-tight line-clamp-2">
            {formatearDescripcionProducto(producto)}
          </p>
        </div>

        {/* Precio y Acción */}
        <div className="flex sm:flex-col flex-row items-center sm:items-end justify-between w-full sm:w-auto gap-3 sm:gap-1 shrink-0">
          <div className="text-right">
            <span className="text-lg font-bold text-slate-900">
              {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-200 rounded-md bg-white">
              <button 
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-slate-700">{cantidad}</span>
              <button 
                onClick={() => setCantidad(cantidad + 1)}
                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm"
              title="Agregar al carrito"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
