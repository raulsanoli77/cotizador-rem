'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionVentas } from '@/lib/email/notifications';

export async function crearPedidoB2B({
  cliente_id,
  numero_po,
  es_po_verbal,
  po_url,
  calle,
  num_exterior,
  num_interior,
  colonia,
  ciudad,
  estado,
  codigo_postal,
  flete_urgente,
  notas_cliente,
  subtotal,
  iva,
  total,
  moneda,
  partidas,
  guardar_direccion,
}: {
  cliente_id: string;
  numero_po?: string;
  es_po_verbal?: boolean;
  po_url?: string;
  calle?: string;
  num_exterior?: string;
  num_interior?: string;
  colonia?: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  flete_urgente?: boolean;
  notas_cliente?: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  partidas: Array<{
    producto_id: string;
    numero_parte: string;
    marca: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
  }>;
  guardar_direccion?: boolean;
}) {
  const supabase = createAdminClient();

  // 0. (Opcional) Guardar dirección en el perfil si el cliente lo solicitó
  if (guardar_direccion) {
    await supabase.from('perfiles_clientes').update({
      calle: calle || null,
      num_exterior: num_exterior || null,
      num_interior: num_interior || null,
      colonia: colonia || null,
      ciudad,
      estado,
      codigo_postal,
    }).eq('id', cliente_id);
  }

  const folioGenerado = numero_po ? numero_po.replace(/^COT-/i, '') : `${Date.now().toString().slice(-6)}`;

  // 1. Crear el Pedido / Cotización Formal
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id,
      numero_po: folioGenerado,
      es_po_verbal: es_po_verbal || false,
      po_url: po_url || null,
      calle: calle || null,
      num_exterior: num_exterior || null,
      num_interior: num_interior || null,
      colonia: colonia || null,
      ciudad,
      estado,
      codigo_postal,
      flete_urgente: flete_urgente || false,
      notas_cliente: notas_cliente || null,
      subtotal,
      iva,
      total,
      moneda,
      estatus: 'pendiente',
    })
    .select()
    .single();

  if (errorPedido) {
    throw new Error('Error al crear la solicitud: ' + errorPedido.message);
  }

  // 2. Crear las partidas
  const partidasParaInsertar = partidas.map((p) => ({
    pedido_id: pedido.id,
    producto_id: p.producto_id,
    numero_parte: p.numero_parte,
    marca: p.marca,
    descripcion: p.descripcion,
    cantidad: p.cantidad,
    precio_unitario: p.precio_unitario,
    importe: p.importe,
  }));

  const { error: errorPartidas } = await supabase
    .from('partidas_pedido')
    .insert(partidasParaInsertar);

  if (errorPartidas) {
    throw new Error('Error al guardar los productos: ' + errorPartidas.message);
  }

  // 3. Obtener datos del cliente para la notificación por correo
  try {
    const { data: clienteData } = await supabase
      .from('perfiles_clientes')
      .select('*, vendedor:vendedores(nombre, email, telefono, activo)')
      .eq('id', cliente_id)
      .single();

    if (clienteData) {
      const direccionCompleta = [
        calle ? `${calle} ${num_exterior || ''}`.trim() : null,
        colonia ? `Col. ${colonia}` : null,
        `${ciudad}, ${estado}`,
        `CP ${codigo_postal}`,
        flete_urgente ? '⚡ SOLICITÓ FLETE URGENTE' : null,
      ].filter(Boolean).join(' | ');

      const vendedorInfo = (clienteData.vendedor as any)?.activo !== false ? clienteData.vendedor : null;

      await enviarNotificacionVentas({
        lead: {
          nombre_completo: clienteData.nombre_completo,
          empresa: clienteData.empresa,
          email: clienteData.email,
          telefono: clienteData.telefono,
          direccion: direccionCompleta,
        },
        vendedor: vendedorInfo as any,
        partidas: partidas.map(p => ({
          cantidad: p.cantidad,
          marca: p.marca,
          numero_parte: p.numero_parte,
          descripcion: p.descripcion,
          precio_unitario: p.precio_unitario,
          total: p.importe,
          moneda,
        })),
        subtotal,
        moneda,
        folio: folioGenerado,
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  } catch (emailErr) {
    console.error('Error enviando correo a ventas:', emailErr);
  }

  return pedido;
}
