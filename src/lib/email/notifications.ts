import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificacionCotizacionParams {
  lead: {
    nombre_completo: string;
    empresa: string;
    email: string;
    telefono: string;
  };
  partidas: Array<{
    cantidad: number;
    marca: string;
    numero_parte: string;
    descripcion: string;
    precio_unitario: number;
    total: number;
    moneda: string;
  }>;
  subtotal: number;
  moneda: string;
  folio: string;
  fecha: string;
}

/**
 * Envía notificación al equipo de ventas cuando un lead
 * solicita una cotización formal.
 */
export async function enviarNotificacionVentas(
  params: NotificacionCotizacionParams
): Promise<{ success: boolean; error?: string }> {
  const destinatario = process.env.NOTIFICATION_EMAIL || 'ventas@remindustrial.com';

  try {
    const { data, error } = await resend.emails.send({
      from: 'REM Industrial <noreply@remindustrial.com>',
      to: [destinatario],
      subject: `Nueva Solicitud de Cotización - ${params.folio} | ${params.lead.empresa}`,
      html: generarHTMLNotificacion(params),
    });

    if (error) {
      console.error('[Email] Error al enviar:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Notificación enviada:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('[Email] Error inesperado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

function generarHTMLNotificacion(params: NotificacionCotizacionParams): string {
  const filasPartidas = params.partidas
    .map(
      (p, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px; text-align: center; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px; font-size: 13px;">${p.cantidad}</td>
        <td style="padding: 8px; font-size: 13px; font-weight: 600;">${p.marca}</td>
        <td style="padding: 8px; font-size: 13px;">${p.numero_parte}</td>
        <td style="padding: 8px; font-size: 13px;">${p.descripcion}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px;">$${p.precio_unitario.toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: 600;">$${p.total.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1f2937;">
    <div style="background: #0f172a; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🔧 REM Industrial</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Nueva Solicitud de Cotización Formal</p>
    </div>

    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
      <table style="width: 100%; margin-bottom: 16px;">
        <tr>
          <td style="font-size: 13px;"><strong>Folio:</strong> ${params.folio}</td>
          <td style="font-size: 13px; text-align: right;"><strong>Fecha:</strong> ${params.fecha}</td>
        </tr>
      </table>

      <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #2563eb;">Datos del Cliente</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${params.lead.nombre_completo}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Empresa:</strong> ${params.lead.empresa}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> <a href="mailto:${params.lead.email}">${params.lead.email}</a></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Teléfono:</strong> ${params.lead.telefono}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px 8px; text-align: center; font-size: 12px; text-transform: uppercase; color: #64748b;">#</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Cant.</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Marca</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">No. Parte</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Descripción</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">P.U.</th>
            <th style="padding: 10px 8px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${filasPartidas}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9;">
            <td colspan="6" style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 14px;">Subtotal (${params.moneda}):</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 14px;">$${params.subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="background: #fefce8; padding: 12px; border: 1px solid #fde68a; border-radius: 0 0 8px 8px;">
      <p style="margin: 0; font-size: 12px; color: #92400e;">⚠️ Este lead solicita una cotización formal. Por favor responda con precios definitivos, disponibilidad y tiempos de entrega.</p>
    </div>
  </body>
  </html>
  `;
}
