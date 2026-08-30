'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { supabase } from '@/lib/supabase/client';

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const obtenerCantidadTotal = useCartStore((s) => s.obtenerCantidadTotal);
  const cantidadItems = obtenerCantidadTotal();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('REM Industrial');

  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
      if (data?.valor) {
        if (data.valor.logo_url) setLogoUrl(data.valor.logo_url);
        if (data.valor.titulo) setTitulo(data.valor.titulo);
      }
    }
    fetchBranding();
  }, []);

  const enlaces = [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/cotizacion', label: 'Cotización' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-brand-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          {logoUrl ? (
            <img src={logoUrl} alt={titulo} className="h-10 object-contain" />
          ) : (
            <span>{titulo}</span>
          )}
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
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
        <nav className="md:hidden bg-brand-900 border-t border-white/10 px-4 py-4 space-y-3">
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
