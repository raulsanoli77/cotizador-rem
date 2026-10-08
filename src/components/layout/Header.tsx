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
  const [headerBusqueda, setHeaderBusqueda] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function fetchBranding() {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
      if (data?.valor) {
        if (data.valor.logo_url) setLogoUrl(data.valor.logo_url);
        if (data.valor.titulo) setTitulo(data.valor.titulo);
      }
    }
    
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        const { data: perfil } = await supabase
          .from('perfiles_clientes')
          .select('estatus')
          .eq('id', session.user.id)
          .single();
        if (perfil && perfil.estatus === 'pendiente') {
          setIsPending(true);
        }
      }
    }

    fetchBranding();
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) checkAuth(); // re-check on change
      else setIsPending(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const enlaces = [
    { href: '/', label: 'Inicio' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/cotizacion', label: 'Checkout' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-brand-700 text-white flex items-center justify-center text-xs sm:text-sm font-medium">
        ¿Prefieres atención personalizada? Contáctanos: <a href="mailto:ventas3@remindustrial.mx" className="ml-1 hover:underline font-bold">ventas3@remindustrial.mx</a> <span className="mx-2">|</span> 📞 <a href="tel:614815170" className="ml-1 hover:underline font-bold">614 81 51 70</a>
      </div>
      <header className="fixed top-8 left-0 right-0 z-40 h-16 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl flex-shrink-0 bg-white rounded-md px-2 py-1 shadow-sm hover:shadow-md transition-shadow">
            <img 
              src={logoUrl || '/logo-rem.png'} 
              alt={titulo} 
              className="h-10 object-contain" 
            />
          </Link>

          {/* Buscador Global (Funcional) */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <form 
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault();
                if (headerBusqueda.trim()) {
                  window.location.href = `/buscar?q=${encodeURIComponent(headerBusqueda.trim())}`;
                } else {
                  window.location.href = '/catalogo';
                }
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={headerBusqueda}
                onChange={(e) => setHeaderBusqueda(e.target.value)}
                placeholder="Buscar categorías por medida, material, recubrimiento..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              <button type="submit" className="hidden">Buscar</button>
            </form>
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
              
              <div className="h-6 w-px bg-slate-700 mx-1"></div>
              
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {isPending && (
                    <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-md">
                      Cuenta en Revisión
                    </span>
                  )}
                  <Link href="/admin/productos" className="text-sm font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Panel Admin
                  </Link>
                </div>
              ) : (
                <>
                  <Link href="/admin/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                  <Link href="/registro" className="text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Crear Cuenta
                  </Link>
                </>
              )}
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
