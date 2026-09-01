'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, Search } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { supabase } from '@/lib/supabase/client';
import CartDrawer from './CartDrawer';

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cartAbierto, setCartAbierto] = useState(false);
  const items = useCartStore((s) => s.items);
  const cantidadItems = items.reduce((acc, item) => acc + item.cantidad, 0);
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
    { href: '/cotizacion', label: 'Checkout' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0">
            <img 
              src={logoUrl || '/logo-rem.png'} 
              alt={titulo} 
              className="h-10 object-contain brightness-0 invert" 
            />
          </Link>

          {/* Buscador Global (Visual) */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por número de parte, marca o descripción..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                onFocus={() => {
                  if(window.location.pathname !== '/catalogo') window.location.href = '/catalogo';
                }}
              />
            </div>
          </div>

          {/* Carrito + Menu Móvil */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <nav className="hidden md:flex items-center gap-6 mr-2">
              {enlaces.slice(0, 2).map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  {e.label}
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setCartAbierto(true)}
              className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5 text-slate-300 group-hover:text-white" />
              <span className="hidden md:inline text-sm font-semibold text-slate-300">Cotización</span>
              {cantidadItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-slate-900">
                  {cantidadItems}
                </span>
              )}
            </button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menu Móvil */}
        {menuAbierto && (
          <nav className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-3">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="block text-sm font-medium text-slate-300 hover:text-white py-2"
                onClick={() => setMenuAbierto(false)}
              >
                {e.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Drawer del Carrito */}
      <CartDrawer isOpen={cartAbierto} onClose={() => setCartAbierto(false)} />
    </>
  );
}
