'use server';

import { createServerClient } from '@/lib/supabase/server';
import { enviarCorreoRevisionCliente } from '@/lib/email/notifications';

export async function actualizarPedido(
  pedidoId: string, 
  estatusNuevo: string, 
  estatusAnterior: string, 
  partidas: any[]
) {
  const supabase = createServerClient();
  
  try {
    // 1. Guardar Estatus
    const { error: errPedido } = await supabase
      .from('pedidos')
      .update({ estatus: estatusNuevo })
      .eq('id', pedidoId);
      
    if (errPedido) throw new Error(errPedido.message);

    // 2. Guardar Partidas
    for (const p of partidas) {
      const { error: errPartida } = await supabase
        .from('partidas_pedido')
        .update({
          tiempo_entrega: p.tiempo_entrega,
          alternativa_producto_id: p.alternativa_producto_id,
          alternativa_numero_parte: p.alternativa_numero_parte,
          alternativa_marca: p.alternativa_marca,
          alternativa_descripcion: p.alternativa_descripcion,
          alternativa_precio: p.alternativa_precio,
          alternativa_motivo: p.alternativa_motivo,
          comentario_admin: p.comentario_admin
        })
        .eq('id', p.id);
      
      if (errPartida) throw new Error(errPartida.message);
    }

    // 3. Notificar si cambió a 'en_revision'
    if (estatusNuevo === 'en_revision' && estatusAnterior !== 'en_revision') {
      const { data: pedidoData } = await supabase
        .from('pedidos')
        .select(`
          id,
          perfil:perfiles_clientes(email, nombre_completo)
        `)
        .eq('id', pedidoId)
        .single();
        
      if (pedidoData?.perfil) {
        const perfilObj: any = Array.isArray(pedidoData.perfil) ? pedidoData.perfil[0] : pedidoData.perfil;
        
        if (perfilObj && perfilObj.email) {
          // Obtenemos baseURL, fallbackeando a Vercel url o localhost
          const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cotizador-rem.vercel.app';
          await enviarCorreoRevisionCliente(
            perfilObj.email, 
            perfilObj.nombre_completo, 
            pedidoId, 
            baseURL
          );
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
