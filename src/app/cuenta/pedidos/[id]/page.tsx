import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import PedidoClientDetail from '@/components/cuenta/PedidoClientDetail';

export const dynamic = 'force-dynamic';

export default async function CuentaPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = createServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Obtener Pedido
  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (errPedido || !pedido) {
    return notFound();
  }

  // Verificar propiedad
  if (pedido.cliente_id !== session.user.id) {
    return notFound(); // No permitir ver pedidos de otros
  }

  // Obtener Partidas
  const { data: partidas, error: errPartidas } = await supabase
    .from('partidas_pedido')
    .select('*')
    .eq('pedido_id', resolvedParams.id)
    .order('id', { ascending: true });

  return (
    <PedidoClientDetail 
      pedido={pedido} 
      partidas={partidas || []} 
    />
  );
}
