import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Package, User } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/admin/login?returnTo=/cuenta/pedidos');
  }

  const { data: perfil } = await supabase
    .from('perfiles_clientes')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full pt-28 pb-12 px-4 sm:px-6 lg:px-8 gap-8">
        {/* Sidebar del Cliente */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-bold text-slate-800 text-lg mb-1">{perfil?.nombre_completo || 'Mi Cuenta'}</h2>
            <p className="text-sm text-slate-500 mb-6">{perfil?.empresa || 'Cliente'}</p>
            
            <nav className="space-y-2">
              <Link href="/cuenta/pedidos" className="flex items-center gap-3 px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-lg">
                <Package className="w-5 h-5" />
                Mis Pedidos
              </Link>
              {/* Espacio para futuras pantallas del cliente */}
            </nav>
          </div>
        </aside>

        {/* Contenido Principal */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
