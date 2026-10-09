'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function aprobarPedidoCliente(
  pedidoId: string, 
  decisiones: Record<string, string> // partidaId -> decision ('alternativa' | 'original' | 'cancelar')
) {
  const supabase = createServerClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No autorizado');

    // 1. Guardar Estatus de Pedido
    const { error: errPedido } = await supabase
      .from('pedidos')
      .update({ estatus: 'aprobado_por_cliente' })
      .eq('id', pedidoId)
      .eq('cliente_id', session.user.id);
      
    if (errPedido) throw new Error(errPedido.message);

    // 2. Guardar decisiones por partida
    for (const [partidaId, decision] of Object.entries(decisiones)) {
      const { error: errPartida } = await supabase
        .from('partidas_pedido')
        .update({ decision_cliente: decision })
        .eq('id', partidaId)
        .eq('pedido_id', pedidoId);
      
      if (errPartida) throw new Error(errPartida.message);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
