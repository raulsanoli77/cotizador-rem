'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { enviarCorreoRevisionCliente } from '@/lib/email/notifications';

export async function actualizarPedido(
  pedidoId: string, 
  estatusNuevo: string, 
  estatusAnterior: string, 
  partidas: any[],
  cotizacionBind?: string,
  datosExtra?: {
    notas_cliente?: string;
    subtotal?: number;
    iva?: number;
    total?: number;
    partidasEliminadas?: string[];
  }
) {
  const supabase = createAdminClient();
  
  try {
    // 1. Guardar Estatus, Cotización Bind ERP y Totales
    const updateData: Record<string, any> = { estatus: estatusNuevo };
    if (cotizacionBind !== undefined) {
      updateData.cotizacion_bind = cotizacionBind.trim() || null;
    }
    if (datosExtra?.notas_cliente !== undefined) {
      updateData.notas_cliente = datosExtra.notas_cliente.trim() || null;
    }
    if (datosExtra?.subtotal !== undefined) {
      updateData.subtotal = datosExtra.subtotal;
      updateData.iva = datosExtra.iva ?? (datosExtra.subtotal * 0.16);
      updateData.total = datosExtra.total ?? (updateData.subtotal + updateData.iva);
    }

    const { data: updatedPedido, error: errPedido } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedidoId)
      .select();
      
    if (errPedido) {
      console.error('[actualizarPedido] Error al actualizar pedido:', errPedido);
      throw new Error(`Error al actualizar pedido: ${errPedido.message}`);
    }

    if (!updatedPedido || updatedPedido.length === 0) {
      throw new Error('No se encontró el pedido o no se pudo actualizar.');
    }

    // 2. Eliminar partidas si alguna fue borrada por el admin
    if (datosExtra?.partidasEliminadas && datosExtra.partidasEliminadas.length > 0) {
      const { error: errDel } = await supabase
        .from('partidas_pedido')
        .delete()
        .in('id', datosExtra.partidasEliminadas);
      if (errDel) console.error('[actualizarPedido] Error al eliminar partidas:', errDel);
    }

    // 3. Guardar / Actualizar Partidas restantes
    for (const p of partidas) {
      const { error: errPartida } = await supabase
        .from('partidas_pedido')
        .update({
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          importe: p.importe ?? (p.cantidad * p.precio_unitario),
          tiempo_entrega: p.tiempo_entrega || null,
          comentario_admin: p.comentario_admin || null,
          alternativa_producto_id: null,
          alternativa_numero_parte: null,
          alternativa_marca: null,
          alternativa_descripcion: null,
          alternativa_precio: null,
          alternativa_motivo: null,
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

    // 4. Revalidar rutas para actualizar vistas
    revalidatePath('/admin/pedidos');
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath('/cuenta/pedidos');
    revalidatePath(`/cuenta/pedidos/${pedidoId}`);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarPedido(pedidoId: string) {
  const supabase = createAdminClient();
  try {
    // 1. Eliminar partidas asociadas
    const { error: errPartidas } = await supabase
      .from('partidas_pedido')
      .delete()
      .eq('pedido_id', pedidoId);

    if (errPartidas) {
      console.error('[eliminarPedido] Error al eliminar partidas:', errPartidas);
    }

    // 2. Eliminar pedido
    const { error: errPedido } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', pedidoId);

    if (errPedido) {
      throw new Error(`Error al eliminar pedido: ${errPedido.message}`);
    }

    revalidatePath('/admin/pedidos');
    revalidatePath('/cuenta/pedidos');

    return { success: true };
  } catch (error: any) {
    console.error('[eliminarPedido] Excepción:', error);
    return { success: false, error: error.message };
  }
}
