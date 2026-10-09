import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import PedidoDetailAdmin from '@/components/admin/PedidoDetail';

export const dynamic = 'force-dynamic';

export default async function AdminPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = createAdminClient();

  // Obtener Pedido
  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .select(`
      *,
      perfil:perfiles_clientes(empresa, nombre_completo, email, telefono)
    `)
    .eq('id', resolvedParams.id)
    .single();

  if (errPedido || !pedido) {
    return (
      <div className="p-8 text-red-500">
        <h1>Error al cargar el pedido</h1>
        <pre>{JSON.stringify(errPedido, null, 2)}</pre>
        <p>Params ID: {resolvedParams.id}</p>
      </div>
    );
  }

  // Obtener Partidas
  const { data: partidas, error: errPartidas } = await supabase
    .from('partidas_pedido')
    .select('*')
    .eq('pedido_id', resolvedParams.id);

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
