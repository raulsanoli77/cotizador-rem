'use client';

import { useCartStore } from '@/stores/cart-store';

export function useCart() {
  const items = useCartStore((s) => s.items);
  const monedaVenta = useCartStore((s) => s.monedaVenta);
  const agregarItem = useCartStore((s) => s.agregarItem);
  const removerItem = useCartStore((s) => s.removerItem);
  const actualizarCantidad = useCartStore((s) => s.actualizarCantidad);
  const limpiarCarrito = useCartStore((s) => s.limpiarCarrito);
  const setMonedaVenta = useCartStore((s) => s.setMonedaVenta);
  const obtenerSubtotal = useCartStore((s) => s.obtenerSubtotal);
  const obtenerTotalItems = useCartStore((s) => s.obtenerTotalItems);
  const obtenerCantidadTotal = useCartStore((s) => s.obtenerCantidadTotal);

  return {
    items,
    monedaVenta,
    agregarItem,
    removerItem,
    actualizarCantidad,
    limpiarCarrito,
    setMonedaVenta,
    subtotal: obtenerSubtotal(),
    totalItems: obtenerTotalItems(),
    cantidadTotal: obtenerCantidadTotal(),
    estaVacio: items.length === 0,
  };
}
