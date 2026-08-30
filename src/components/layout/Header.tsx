'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const obtenerCantidadTotal = useCartStore((s) => s.obtenerCantidadTotal);
  const cantidadItems = obtenerCantidadTotal();

  const enlaces = [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/cotizacion', label: 'Cotización' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0f172a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Wrench className="h-6 w-6 text-blue-400" />
          <span>REM <span className="text-blue-400">Industrial</span></span>
        </Link>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {e.label}
            </Link>
          ))}
        </nav>

        {/* Carrito + Menu Móvil */}
        <div className="flex items-center gap-4">
          <Link
            href="/cotizacion"
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {cantidadItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cantidadItems}
              </span>
            )}
          </Link>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu Móvil */}
      {menuAbierto && (
        <nav className="md:hidden bg-[#0f172a] border-t border-gray-800 px-4 py-4 space-y-3">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="block text-sm font-medium text-gray-300 hover:text-white py-2"
              onClick={() => setMenuAbierto(false)}
            >
              {e.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
