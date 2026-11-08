'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { exigirSesionUsuarioServerAction } from '@/lib/auth/admin-auth';
import { sincronizarPreciosCarrito, resolverCargaRapidaCodigos } from '@/app/catalogo/actions';
import { generarUrlFirmadaPdfBind } from '@/lib/storage/pdf-bind';
import type { ProductoConPrecio } from '@/types';

export async function aprobarPedidoAdmin(
  pedidoId: string, 
  clienteId: string,
  decisiones: Record<string, string>,
  cantidades: Record<string, number>
) {
  try {
    await exigirSesionUsuarioServerAction(clienteId);
    const supabase = createAdminClient();
    
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

/**
 * Genera una URL firmada temporal para que el dueño del pedido o un Administrador
 * pueda ver/descargar el PDF oficial de Bind ERP desde el bucket privado.
 */
export async function obtenerUrlDescargaPdfBind(
  pedidoId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const sesion = await exigirSesionUsuarioServerAction();
    const supabase = createAdminClient();

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('id, cliente_id, po_url')
      .eq('id', pedidoId)
      .single();

    if (error || !pedido || !pedido.po_url) {
      throw new Error('El documento PDF no se encuentra disponible.');
    }

    if (pedido.cliente_id !== sesion.user.id && !sesion.esAdmin) {
      throw new Error('No tienes permiso para descargar este documento.');
    }

    const signedUrl = await generarUrlFirmadaPdfBind(pedido.po_url);
    if (!signedUrl) {
      throw new Error('No se pudo generar el enlace seguro de descarga.');
    }

    return { success: true, url: signedUrl };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al obtener el PDF de la cotización.',
    };
  }
}

/**
 * Obtiene las partidas de un pedido anterior del cliente y las sincroniza con
 * los productos y precios vigentes del catálogo para volver a cotizar con un clic.
 * Usa exclusivamente la sesión autenticada del servidor.
 */
export async function obtenerPartidasParaRepetirPedido(
  pedidoId: string
): Promise<{
  success: boolean;
  error?: string;
  items: { producto: ProductoConPrecio; cantidad: number }[];
  noDisponibles: string[];
}> {
  try {
    const sesion = await exigirSesionUsuarioServerAction();
    const supabase = createAdminClient();

    const { data: pedido, error: errPed } = await supabase
      .from('pedidos')
      .select('id, cliente_id')
      .eq('id', pedidoId)
      .single();

    if (errPed || !pedido) {
      throw new Error('No se encontró la solicitud de cotización.');
    }

    if (pedido.cliente_id !== sesion.user.id && !sesion.esAdmin) {
      throw new Error('No tienes permiso para acceder a esta cotización.');
    }

    const { data: partidas, error: errPart } = await supabase
      .from('partidas_pedido')
      .select('producto_id, numero_parte, cantidad')
      .eq('pedido_id', pedidoId)
      .order('id', { ascending: true });

    if (errPart || !partidas || partidas.length === 0) {
      throw new Error('Esta cotización no contiene partidas registradas.');
    }

    // 1. Intentar resolver primero por producto_id vigente usando la cookie del servidor (null)
    const ids = partidas.map((p) => p.producto_id).filter(Boolean);
    const prodsPorId = await sincronizarPreciosCarrito(ids, null);
    const mapaPorId = new Map<string, ProductoConPrecio>();
    prodsPorId.forEach((p) => mapaPorId.set(p.id, p));

    // 2. Para partidas cuyo producto_id haya cambiado (ej. recarga de catálogo), buscar por numero_parte
    const faltantesPorCodigo: { codigo: string; cantidad: number }[] = [];
    const itemsFinales: { producto: ProductoConPrecio; cantidad: number }[] = [];
    const noDisponibles: string[] = [];

    for (const part of partidas) {
      const cant = Math.max(1, Number(part.cantidad) || 1);
      const prodMatch = part.producto_id ? mapaPorId.get(part.producto_id) : undefined;
      if (prodMatch) {
        itemsFinales.push({ producto: prodMatch, cantidad: cant });
      } else if (part.numero_parte) {
        faltantesPorCodigo.push({ codigo: part.numero_parte, cantidad: cant });
      }
    }

    if (faltantesPorCodigo.length > 0) {
      const resCodigos = await resolverCargaRapidaCodigos(faltantesPorCodigo, null);
      for (const enc of resCodigos.encontrados) {
        itemsFinales.push({ producto: enc.producto, cantidad: enc.cantidadFinal });
      }
      noDisponibles.push(...resCodigos.noEncontrados);
    }

    return {
      success: true,
      items: itemsFinales,
      noDisponibles,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al recargar partidas del pedido',
      items: [],
      noDisponibles: [],
    };
  }
}
