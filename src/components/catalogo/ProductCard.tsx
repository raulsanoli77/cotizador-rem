'use client';

import { ShoppingCart, Plus } from 'lucide-react';
import type { ProductoConPrecio } from '@/types/product';
import { formatearPrecio } from '@/lib/pricing/engine';
import { useCartStore } from '@/stores/cart-store';

interface ProductCardProps {
  producto: ProductoConPrecio;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const specs = producto.especificaciones_tecnicas;
  const specsEntries = Object.entries(specs).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden group">
      <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.numero_parte} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-gray-300 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">{producto.marca}</p>
        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{producto.numero_parte}</h3>
        <p className="text-xs text-gray-500 mb-3">{producto.categoria}</p>
        {specsEntries.length > 0 && (
          <div className="space-y-1 mb-3">
            {specsEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-500">{key}</span>
                <span className="text-gray-700 font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">
            {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
          </span>
          <button
            onClick={() => agregarItem(producto)}
            className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-lg transition-colors"
            title="Agregar al carrito"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
