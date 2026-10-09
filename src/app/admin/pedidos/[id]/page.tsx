import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import PedidoDetailAdmin from '@/components/admin/PedidoDetail';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  // Obtener Pedido
  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select(`
      *,
      perfil:perfiles_clientes(empresa, nombre_completo, email, telefono)
    `)
    .eq('id', params.id)
    .single();

  if (errPedido || !pedido) {
    return notFound();
  }

  // Obtener Partidas
  const { data: partidas, error: errPartidas } = await supabase
    .from('partidas_pedido')
    .select('*')
    .eq('pedido_id', params.id);

  // (Opcional) Obtener información actual de los productos del catálogo por si se necesita
  // const productIds = partidas?.map((p: any) => p.producto_id).filter(Boolean) || [];
  // const { data: productos } = await supabase.from('productos').select('*').in('id', productIds);

  return (
    <PedidoDetailAdmin 
      pedido={pedido} 
      partidas={partidas || []} 
      productosOriginales={[]} 
    />
  );
}
