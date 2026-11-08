'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { exigirAdminServerAction } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';
import { enviarCorreoRevisionCliente } from '@/lib/email/notifications';
import { BUCKET_PDF_BIND, PDF_BIND_MAX_BYTES, esReferenciaPdfBindSegura } from '@/lib/storage/pdf-bind-shared';
import { asegurarBucketPrivadoPdf, eliminarArchivoPdfBindAnterior, generarUrlFirmadaPdfBind } from '@/lib/storage/pdf-bind';

/**
 * Sube el PDF oficial de Bind ERP desde el servidor (validando rol Admin, firma %PDF- y límite de 15 MB),
 * lo guarda en el bucket privado `cotizaciones-bind`, limpia cualquier PDF anterior del pedido
 * y actualiza `pedidos.po_url` atómicamente.
 */
export async function subirPdfBindPedido(
  pedidoId: string,
  folioLimpio: string,
  formData: FormData
): Promise<{ success: boolean; po_url?: string; signedUrl?: string | null; error?: string }> {
  try {
    await exigirAdminServerAction();

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      throw new Error('No se recibió un archivo PDF válido.');
    }

    if (file.size <= 0 || file.size > PDF_BIND_MAX_BYTES) {
      throw new Error('El archivo PDF no debe superar los 15 MB.');
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Solo se permiten archivos en formato PDF.');
    }

    // Validar cabecera mágica %PDF- en servidor
    const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const headerAscii = String.fromCharCode(...headerBytes);
    if (headerAscii !== '%PDF-') {
      throw new Error('El archivo seleccionado no es un documento PDF válido.');
    }

    const supabase = createAdminClient();
    const { data: pedidoActual, error: errPed } = await supabase
      .from('pedidos')
      .select('id, po_url')
      .eq('id', pedidoId)
      .single();

    if (errPed || !pedidoActual) {
      throw new Error('No se encontró el pedido especificado.');
    }

    await asegurarBucketPrivadoPdf();

    const safePedidoId = pedidoId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFolio = (folioLimpio || 'COT').replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = `${safePedidoId}/Cotizacion_REM_${safeFolio}_${Date.now()}.pdf`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_PDF_BIND)
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error al guardar el PDF en Storage: ${uploadError.message}`);
    }

    // Actualizar po_url en el pedido
    const { error: updateErr } = await supabase
      .from('pedidos')
      .update({ po_url: filePath })
      .eq('id', pedidoId);

    if (updateErr) {
      await supabase.storage.from(BUCKET_PDF_BIND).remove([filePath]);
      throw new Error(`No se pudo asociar el PDF al pedido: ${updateErr.message}`);
    }

    // Eliminar PDF anterior si existía para no dejar archivos huérfanos
    if (pedidoActual.po_url && pedidoActual.po_url !== filePath) {
      await eliminarArchivoPdfBindAnterior(pedidoActual.po_url);
    }

    const signedUrl = await generarUrlFirmadaPdfBind(filePath);

    revalidatePath('/admin/pedidos');
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath('/cuenta/pedidos');
    revalidatePath(`/cuenta/pedidos/${pedidoId}`);

    return {
      success: true,
      po_url: filePath,
      signedUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al subir el PDF de Bind ERP.',
    };
  }
}

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
    po_url?: string | null;
  }
) {
  try {
    await exigirAdminServerAction();
    const supabase = createAdminClient();

    // Consultar po_url previo por si el admin quitó el PDF adjunto
    const { data: pedidoPrevio } = await supabase
      .from('pedidos')
      .select('po_url')
      .eq('id', pedidoId)
      .maybeSingle();

    // 1. Guardar Estatus, Cotización Bind ERP y Totales
    const updateData: Record<string, any> = { estatus: estatusNuevo };
    if (cotizacionBind !== undefined) {
      updateData.cotizacion_bind = cotizacionBind.trim() || null;
    }
    if (datosExtra?.po_url !== undefined) {
      if (datosExtra.po_url === null || datosExtra.po_url === '') {
        updateData.po_url = null;
      } else if (esReferenciaPdfBindSegura(datosExtra.po_url)) {
        updateData.po_url = datosExtra.po_url.trim();
      } else {
        throw new Error('Referencia de archivo PDF no válida.');
      }
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

    // Si el admin eliminó o reemplazó el PDF, borrar el archivo anterior del Storage
    if (
      datosExtra?.po_url !== undefined &&
      pedidoPrevio?.po_url &&
      pedidoPrevio.po_url !== updateData.po_url
    ) {
      await eliminarArchivoPdfBindAnterior(pedidoPrevio.po_url);
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

    // 4. Notificar si cambió a 'en_revision'
    if (estatusNuevo === 'en_revision' && estatusAnterior !== 'en_revision') {
      const { data: pedidoData } = await supabase
        .from('pedidos')
        .select(`
          id,
          perfil:perfiles_clientes(
            email,
            nombre_completo,
            vendedor:vendedores(nombre, email, telefono, activo)
          )
        `)
        .eq('id', pedidoId)
        .single();
        
      if (pedidoData?.perfil) {
        const perfilObj: any = Array.isArray(pedidoData.perfil) ? pedidoData.perfil[0] : pedidoData.perfil;
        
        if (perfilObj && perfilObj.email) {
          const vendRaw = Array.isArray(perfilObj.vendedor) ? perfilObj.vendedor[0] : perfilObj.vendedor;
          const vendedorAsignado = vendRaw && vendRaw.activo !== false ? vendRaw : null;
          const baseURL =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            'https://www.remindustrial.mx';
          await enviarCorreoRevisionCliente(
            perfilObj.email, 
            perfilObj.nombre_completo, 
            pedidoId, 
            baseURL,
            vendedorAsignado
          );
        }
      }
    }

    // 5. Revalidar rutas para actualizar vistas
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
  try {
    await exigirAdminServerAction();
    const supabase = createAdminClient();

    const { data: pedidoPrevio } = await supabase
      .from('pedidos')
      .select('po_url')
      .eq('id', pedidoId)
      .maybeSingle();

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

    if (pedidoPrevio?.po_url) {
      await eliminarArchivoPdfBindAnterior(pedidoPrevio.po_url);
    }

    revalidatePath('/admin/pedidos');
    revalidatePath('/cuenta/pedidos');

    return { success: true };
  } catch (error: any) {
    console.error('[eliminarPedido] Excepción:', error);
    return { success: false, error: error.message };
  }
}
