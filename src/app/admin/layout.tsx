'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { LayoutDashboard, Package, UploadCloud, Users, Settings, LogOut, Loader2, Tags } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else if (session && pathname === '/admin/login') {
        router.push('/admin/productos');
      } else {
        setAuthenticated(!!session);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/admin/login');
      } else if (session) {
        setAuthenticated(true);
        if (pathname === '/admin/login') router.push('/admin/productos');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!authenticated && pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authenticated) return null;

  const menu = [
    { name: 'Catálogo', icon: Package, href: '/admin/productos' },
    { name: 'Categorías', icon: Tags, href: '/admin/categorias' },
    { name: 'Carga Masiva', icon: UploadCloud, href: '/admin/carga-masiva' },
    { name: 'Leads B2B', icon: Users, href: '/admin/leads' },
    { name: 'Configuración', icon: Settings, href: '/admin/config' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <LayoutDashboard className="h-5 w-5 text-brand-400 mr-2" />
          <span className="font-bold text-lg">Admin REM</span>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {menu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon className="h-5 w-5 mr-3 shrink-0" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Widget de Tipo de Cambio */}
        <div className="px-4 mb-4">
          <AdminExchangeRateWidget />
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Widget interno para cargar el TC en el cliente sin bloquear todo el layout
function AdminExchangeRateWidget() {
  const [tcReal, setTcReal] = useState<number | null>(null);
  const [tcAplicado, setTcAplicado] = useState<number | null>(null);
  
  useEffect(() => {
    import('@/lib/pricing/exchange-rate').then(({ obtenerTipoCambio }) => {
      import('@/lib/pricing/engine').then(({ aplicarRedondeoREM }) => {
        obtenerTipoCambio().then((res) => {
          setTcReal(res.valor);
          setTcAplicado(aplicarRedondeoREM(res.valor));
        });
      });
    });
  }, []);

  if (!tcReal || !tcAplicado) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Cambio</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">API Real:</span>
          <span className="text-slate-300">${tcReal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-brand-400">Cobro:</span>
          <span className="text-white">${tcAplicado.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
