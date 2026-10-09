'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Package, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/admin/login?returnTo=/cuenta/pedidos');
        return;
      }

      const { data } = await supabase
        .from('perfiles_clientes')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setPerfil(data);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full pt-28 pb-12 px-4 sm:px-6 lg:px-8 gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-1">{perfil?.nombre_completo || 'Mi Cuenta'}</h2>
            <p className="text-sm text-slate-500 mb-6">{perfil?.empresa || 'Cliente'}</p>
            
            <nav className="space-y-2">
              <Link href="/cuenta/pedidos" className="flex items-center gap-3 px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-lg">
                <Package className="w-5 h-5" />
                Mis Pedidos
              </Link>
            </nav>
          </div>
        </aside>

        <div className="flex-1">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
