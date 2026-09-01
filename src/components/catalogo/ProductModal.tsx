'use client';

import { useState } from 'react';
import { X, ShoppingCart, Plus, Minus, ChevronRight } from 'lucide-react';
import type { ProductoConPrecio } from '@/types/product';
import { formatearPrecio } from '@/lib/pricing/engine';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import { useCartStore } from '@/stores/cart-store';

interface ProductModalProps {
  producto: ProductoConPrecio | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ producto, isOpen, onClose }: ProductModalProps) {
  const agregarItem = useCartStore((s) => s.agregarItem);
  const [cantidad, setCantidad] = useState(1);

  if (!isOpen || !producto) return null;

  const handleAdd = () => {
    agregarItem(producto, cantidad);
    setCantidad(1);
    onClose(); // Cerrar modal despuǸs de agregar
  };

  const specs = producto.especificaciones_tecnicas || {};
  const specsEntries = Object.entries(specs);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay Oscuro */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Contenedor del Modal (Dark/Light hbrido estilo GWS) */}
      <div className="relative w-full max-w-5xl bg-slate-900 shadow-2xl rounded-xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Botn de Cerrar (Flotante) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Lado Izquierdo: Imagen Blanca */}
        <div className="w-full md:w-5/12 bg-white p-8 flex items-center justify-center border-r border-slate-800 shrink-0">
          {producto.imagen_url ? (
            <img 
              src={producto.imagen_url} 
              alt={producto.numero_parte} 
              className="max-h-80 max-w-full object-contain drop-shadow-xl" 
            />
          ) : (
            <div className="text-slate-300 text-center flex flex-col items-center">
              <ShoppingCart className="h-24 w-24 mb-4 opacity-50" />
              <span className="text-sm font-semibold uppercase tracking-widest">Fotografa Pendiente</span>
            </div>
          )}
        </div>

        {/* Lado Derecho: Info TǸcnica */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-8 md:p-10 flex-1">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              <span>Catǭlogo</span>
              <ChevronRight className="h-3 w-3" />
              <span>{producto.categoria}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-brand-500">{producto.marca}</span>
            </div>

            {/* Ttulo Gigante */}
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
              {producto.numero_parte}
            </h2>

            {/* Resumen rǭpido */}
            <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-lg">
              {formatearDescripcionProducto(producto)}
            </p>

            {/* ǭrea de Compra */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Unitario</p>
                <div className="text-3xl font-black text-white flex items-baseline gap-2">
                  {formatearPrecio(producto.precio_venta, producto.moneda_venta)}
                  <span className="text-sm font-medium text-slate-500 uppercase">{producto.moneda_venta}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-md">
                  <button 
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-white">{cantidad}</span>
                  <button 
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-3 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-md font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Atributos TǸcnicos (Grid estilo GWS) */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-800 pb-3 mb-6">
                Especificaciones TǸcnicas
              </h3>
              
              {specsEntries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {specsEntries.map(([key, value]) => (
                    <div key={key} className="bg-slate-800/30 border border-slate-800 p-3 rounded flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{key}</span>
                      <span className="text-sm font-medium text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No hay especificaciones adicionales registradas.</p>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
