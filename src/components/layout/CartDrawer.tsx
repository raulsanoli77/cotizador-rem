'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { formatearPrecio } from '@/lib/pricing/engine';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const items = useCartStore((s) => s.items);
  const obtenerSubtotal = useCartStore((s) => s.obtenerSubtotal);
  const removerItem = useCartStore((s) => s.removerItem);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md flex flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-600" />
            Cotización Actual
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart className="h-16 w-16 opacity-20" />
              <p>Tu lista de cotización está vacía</p>
              <button onClick={onClose} className="text-brand-600 font-semibold hover:underline">Ir al catálogo</button>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.producto.id} className="flex gap-4">
                  <div className="h-16 w-16 bg-slate-100 rounded-lg flex-shrink-0 border border-slate-200 p-1 flex items-center justify-center">
                    {item.producto.imagen_url ? (
                      <img src={item.producto.imagen_url} alt={item.producto.numero_parte} className="max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">{item.producto.marca}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-brand-700 truncate">{item.producto.numero_parte}</p>
                    <p className="text-xs text-slate-500 uppercase truncate mt-0.5">{item.producto.categoria}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.cantidad} x {formatearPrecio(item.producto.precio_venta, item.producto.moneda_venta)}
                      </p>
                      <button onClick={() => removerItem(item.producto.id)} className="text-xs text-red-500 font-medium hover:underline">
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-6 bg-slate-50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500">Subtotal estimado</span>
              <span className="text-xl font-bold text-slate-900">
                {formatearPrecio(obtenerSubtotal(), items[0]?.producto.moneda_venta || 'USD')}
              </span>
            </div>
            <Link 
              href="/cotizacion" 
              onClick={onClose}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
            >
              Proceder a Cotización Formal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
