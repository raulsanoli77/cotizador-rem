'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function aprobarPedidoAdmin(
  pedidoId: string, 
  clienteId: string,
  decisiones: Record<string, string>,
  cantidades: Record<string, number>
) {
  const supabase = createAdminClient();
  
  try {
    // 1. Guardar Estatus de Pedido
    const { error: errPedido } = await supabase
      .from('pedidos')
      .update({ estatus: 'aprobado_por_cliente' })
      .eq('id', pedidoId)
      .eq('cliente_id', clienteId);
      
    if (errPedido) throw new Error(errPedido.message);

    // 2. Guardar decisiones por partida
    for (const [partidaId, decision] of Object.entries(decisiones)) {
      const { error: errPartida } = await supabase
        .from('partidas_pedido')
        .update({ 
          decision_cliente: decision,
          alternativa_cantidad: cantidades[partidaId] || null
        })
        .eq('id', partidaId)
        .eq('pedido_id', pedidoId);
      
      if (errPartida) throw new Error(errPartida.message);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
