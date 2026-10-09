'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function crearPedidoB2B({
  cliente_id,
  numero_po,
  es_po_verbal,
  po_url,
  direccion_envio,
  ciudad,
  estado,
  codigo_postal,
  paqueteria,
  notas_cliente,
  subtotal,
  iva,
  total,
  moneda,
  partidas,
}: {
  cliente_id: string;
  numero_po?: string;
  es_po_verbal: boolean;
  po_url?: string;
  direccion_envio: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  paqueteria?: string;
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
}) {
  const supabase = createAdminClient();

  // 1. Crear el Pedido
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id,
      numero_po,
      es_po_verbal,
      po_url,
      direccion_envio,
      ciudad,
      estado,
      codigo_postal,
      paqueteria,
      notas_cliente,
      subtotal,
      iva,
      total,
      moneda,
      estatus: 'nuevo',
    })
    .select()
    .single();

  if (errorPedido) {
    throw new Error('Error al crear el pedido: ' + errorPedido.message);
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
    // Ideally we would rollback the order here or use an RPC
    throw new Error('Error al guardar los productos del pedido: ' + errorPartidas.message);
  }

  // 3. (Opcional) Enviar notificación por correo al Administrador
  // Aquí puedes agregar un resend email a ventas3@remindustrial.mx

  return pedido;
}
