import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ProductoConPrecio } from '@/types/product';
import type { ItemCarrito } from '@/types/quote';
import { obtenerMultiploVenta } from '@/lib/pricing/formatters';

interface CartState {
  items: ItemCarrito[];
  monedaVenta: 'USD' | 'MXN';
  agregarItem: (producto: ProductoConPrecio, cantidad?: number) => void;
  removerItem: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  limpiarCarrito: () => void;
  setMonedaVenta: (moneda: 'USD' | 'MXN') => void;
  obtenerSubtotal: () => number;
  obtenerTotalItems: () => number;
  obtenerCantidadTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      monedaVenta: 'MXN' as const,

      agregarItem: (producto: ProductoConPrecio, cantidad = 1) => {
        const multiplo = obtenerMultiploVenta(producto);
        const cantAjustada =
          multiplo > 1
            ? Math.max(multiplo, Math.ceil(cantidad / multiplo) * multiplo)
            : Math.max(1, cantidad);

        set((state) => {
          const existente = state.items.find(
            (item) => item.producto.id === producto.id
          );
          if (existente) {
            return {
              items: state.items.map((item) =>
                item.producto.id === producto.id
                  ? { ...item, cantidad: item.cantidad + cantAjustada }
                  : item
              ),
            };
          }
          return { items: [...state.items, { producto, cantidad: cantAjustada }] };
        });
      },

      removerItem: (productoId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.producto.id !== productoId),
        }));
      },

      actualizarCantidad: (productoId: string, cantidad: number) => {
        if (cantidad <= 0) {
          get().removerItem(productoId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (item.producto.id !== productoId) return item;
            const multiplo = obtenerMultiploVenta(item.producto);
            const cantValida =
              multiplo > 1
                ? Math.max(multiplo, Math.round(cantidad / multiplo) * multiplo)
                : cantidad;
            return { ...item, cantidad: cantValida };
          }),
        }));
      },

      limpiarCarrito: () => set({ items: [] }),
      setMonedaVenta: (moneda) => set({ monedaVenta: moneda }),

      obtenerSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.producto.precio_venta * item.cantidad, 0
        );
      },
      obtenerTotalItems: () => get().items.length,
      obtenerCantidadTotal: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },
    }),
    {
      name: 'rem-carrito',
      partialize: (state) => ({ items: state.items, monedaVenta: state.monedaVenta }),
    }
  )
);
