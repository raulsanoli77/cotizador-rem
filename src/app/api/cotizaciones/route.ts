import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionVentas } from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, partidas, subtotal, moneda_venta, tipo_cambio_usado, formula_aplicada, lead_info, enviar_notificacion } = body;

    if (!lead_id || !partidas || partidas.length === 0) {
      return NextResponse.json(
        { error: 'Datos de cotización incompletos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generar folio único
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-5);
    const folio = `REM-${year}-${timestamp}`;

    // Guardar cotización
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert({
        lead_id,
        folio,
        partidas,
        subtotal: subtotal || 0,
        moneda_venta: moneda_venta || 'MXN',
        tipo_cambio_usado,
        formula_aplicada,
        estatus: enviar_notificacion ? 'solicitada' : 'borrador',
      })
      .select()
      .single();

    if (error) {
      console.error('[API/cotizaciones] Error al guardar:', error);
      return NextResponse.json(
        { error: 'Error al guardar la cotización' },
        { status: 500 }
      );
    }

    // Enviar notificación por email si se solicitó cotización formal
    if (enviar_notificacion && lead_info) {
      const fecha = now.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Fire and forget - no bloquear la respuesta
      enviarNotificacionVentas({
        lead: lead_info,
        partidas,
        subtotal: subtotal || 0,
        moneda: moneda_venta || 'MXN',
        folio,
        fecha,
      }).catch((err) => console.error('[API/cotizaciones] Error enviando email:', err));
    }

    return NextResponse.json({
      ...data,
      folio,
      message: enviar_notificacion
        ? 'Cotización guardada y notificación enviada'
        : 'Cotización guardada como borrador',
    });
  } catch (error) {
    console.error('[API/cotizaciones] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
