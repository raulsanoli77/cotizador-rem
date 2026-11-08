'use server';

import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exigirSesionUsuarioServerAction } from '@/lib/auth/admin-auth';
import { enviarNotificacionVentas, enviarConfirmacionPedidoCliente } from '@/lib/email/notifications';
import { recalcularPartidasServidor, generarSufijoFolio } from '@/lib/pricing/server-verifier';

export async function crearPedidoB2B({
  cliente_id,
  es_po_verbal,
  calle,
  num_exterior,
  num_interior,
  colonia,
  ciudad,
  estado,
  codigo_postal,
  flete_urgente,
  notas_cliente,
  partidas,
  guardar_direccion,
}: {
  cliente_id: string;
  numero_po?: string;
  es_po_verbal?: boolean;
  calle?: string;
  num_exterior?: string;
  num_interior?: string;
  colonia?: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  flete_urgente?: boolean;
  notas_cliente?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  moneda?: string;
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
  // 1. Verificar sesión autenticada y coincidencia con cliente_id
  await exigirSesionUsuarioServerAction(cliente_id);

  const supabase = createAdminClient();

  // 2. Verificar que el perfil del cliente exista y esté aprobado
  const { data: clienteData, error: errCliente } = await supabase
    .from('perfiles_clientes')
    .select('*, vendedor:vendedores(nombre, email, telefono, activo)')
    .eq('id', cliente_id)
    .single();

  if (errCliente || !clienteData || clienteData.estatus !== 'aprobado') {
    throw new Error('No autorizado: Tu cuenta empresarial debe estar aprobada para generar pedidos.');
  }

  // 3. Recalcular precios, múltiplos, subtotal, IVA y total en el servidor desde la BD
  const verificado = await recalcularPartidasServidor(partidas, true);
  const {
    partidas: partidasOficiales,
    subtotal: subtotalOficial,
    iva: ivaOficial,
    total: totalOficial,
    moneda: monedaOficial,
  } = verificado;

  // 4. (Opcional) Guardar dirección en el perfil si el cliente lo solicitó
  if (guardar_direccion) {
    await supabase
      .from('perfiles_clientes')
      .update({
        calle: calle || null,
        num_exterior: num_exterior || null,
        num_interior: num_interior || null,
        colonia: colonia || null,
        ciudad,
        estado,
        codigo_postal,
      })
      .eq('id', cliente_id);
  }

  const folioGenerado = `${Date.now().toString().slice(-6)}${generarSufijoFolio(2)}`;

  // 5. Crear el Pedido / Cotización Formal con importes verificados en servidor
  const { data: pedido, error: errorPedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id,
      numero_po: folioGenerado,
      es_po_verbal: es_po_verbal || false,
      po_url: null,
      calle: calle || null,
      num_exterior: num_exterior || null,
      num_interior: num_interior || null,
      colonia: colonia || null,
      ciudad,
      estado,
      codigo_postal,
      flete_urgente: flete_urgente || false,
      notas_cliente: notas_cliente || null,
      subtotal: subtotalOficial,
      iva: ivaOficial,
      total: totalOficial,
      moneda: monedaOficial,
      estatus: 'pendiente',
    })
    .select()
    .single();

  if (errorPedido || !pedido) {
    throw new Error('Error al crear la solicitud: ' + (errorPedido?.message || 'Error desconocido'));
  }

  // 6. Crear las partidas verificadas; si falla, aplicar rollback del encabezado del pedido
  const partidasParaInsertar = partidasOficiales.map((p) => ({
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
    // Rollback: eliminar el pedido huérfano recién insertado
    await supabase.from('pedidos').delete().eq('id', pedido.id);
    throw new Error('Error al guardar los productos del pedido: ' + errorPartidas.message);
  }

  // 7. Enviar notificaciones por correo en segundo plano (sin bloquear la respuesta del checkout)
  after(async () => {
    try {
      const direccionCompleta = [
        calle ? `${calle} ${num_exterior || ''}`.trim() : null,
        colonia ? `Col. ${colonia}` : null,
        `${ciudad}, ${estado}`,
        `CP ${codigo_postal}`,
        flete_urgente ? '⚡ SOLICITÓ FLETE URGENTE' : null,
      ]
        .filter(Boolean)
        .join(' | ');

      const vendedorInfo =
        (clienteData.vendedor as any)?.activo !== false ? clienteData.vendedor : null;

      await Promise.allSettled([
        enviarNotificacionVentas({
          lead: {
            nombre_completo: clienteData.nombre_completo,
            empresa: clienteData.empresa,
            email: clienteData.email,
            telefono: clienteData.telefono,
            direccion: direccionCompleta,
          },
          vendedor: vendedorInfo as any,
          partidas: partidasOficiales.map((p) => ({
            cantidad: p.cantidad,
            marca: p.marca,
            numero_parte: p.numero_parte,
            descripcion: p.descripcion,
            precio_unitario: p.precio_unitario,
            total: p.importe,
            moneda: monedaOficial,
          })),
          subtotal: subtotalOficial,
          moneda: monedaOficial,
          folio: folioGenerado,
          fecha: new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }),
        enviarConfirmacionPedidoCliente({
          cliente: {
            nombre_completo: clienteData.nombre_completo,
            empresa: clienteData.empresa,
            email: clienteData.email,
          },
          vendedor: vendedorInfo as any,
          partidas: partidasOficiales.map((p) => ({
            cantidad: p.cantidad,
            marca: p.marca,
            numero_parte: p.numero_parte,
            descripcion: p.descripcion,
            precio_unitario: p.precio_unitario,
            total: p.importe,
          })),
          subtotal: subtotalOficial,
          iva: ivaOficial,
          total: totalOficial,
          moneda: monedaOficial,
          folio: folioGenerado,
          pedidoId: pedido.id,
        }),
      ]);
    } catch (emailErr) {
      console.error('Error enviando correos de cotización:', emailErr);
    }
  });

  return pedido;
}
