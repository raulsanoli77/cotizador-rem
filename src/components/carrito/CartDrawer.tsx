'use client';

import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { formatearPrecio } from '@/lib/pricing/engine';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const actualizarCantidad = useCartStore((s) => s.actualizarCantidad);
  const removerItem = useCartStore((s) => s.removerItem);
  const obtenerSubtotal = useCartStore((s) => s.obtenerSubtotal);
  const monedaVenta = useCartStore((s) => s.monedaVenta);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg text-gray-900">Carrito de Cotización</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.producto.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-600 font-semibold">{item.producto.marca}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{item.producto.numero_parte}</p>
                    <p className="text-xs text-gray-500">{formatearPrecio(item.producto.precio_venta, item.producto.moneda_venta)} c/u</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)} className="p-1 hover:bg-gray-200 rounded"><Minus className="h-3 w-3" /></button>
                      <span className="text-sm font-medium w-8 text-center">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)} className="p-1 hover:bg-gray-200 rounded"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => removerItem(item.producto.id)} className="p-1 hover:bg-red-100 rounded text-red-500 ml-auto"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatearPrecio(item.producto.precio_venta * item.cantidad, item.producto.moneda_venta)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700">Subtotal:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatearPrecio(obtenerSubtotal(), monedaVenta)}
                </span>
              </div>
              <a href="/cotizacion" className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center py-3 rounded-xl font-semibold transition-colors">
                Ver Cotización
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
