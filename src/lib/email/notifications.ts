import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = process.env.FROM_EMAIL || 'REM Industrial <onboarding@resend.dev>';

function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NotificacionCotizacionParams {
  lead: {
    nombre_completo: string;
    empresa: string;
    email: string;
    telefono: string;
    direccion?: string;
  };
  vendedor?: {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
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
  const destinatarioPrincipal = process.env.NOTIFICATION_EMAIL || 'ventas@remindustrial.com';
  const destinatarios = [destinatarioPrincipal];
  if (params.vendedor?.email && !destinatarios.includes(params.vendedor.email)) {
    destinatarios.push(params.vendedor.email);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: destinatarios,
      subject: `Nueva Solicitud de Cotización - #${params.folio.replace(/^COT-/i, '')} | ${params.lead.empresa}${params.vendedor ? ` [Asesor: ${params.vendedor.nombre}]` : ''}`,
      html: generarHTMLNotificacion(params),
    });

    if (error) {
      console.error('[Email] Error al enviar:', error);

      // Si el error es por restricción de sandbox de Resend (solo permite enviar a la cuenta registrada)
      if (
        error.message?.includes('testing emails to your own email address') || 
        error.message?.includes('verify a domain')
      ) {
        console.warn('[Email] Reintentando envío a la cuenta autorizada de Resend (Sandbox fallback)...');
        const match = error.message.match(/\(([^)]+)\)/);
        const ownerEmail = match ? match[1] : 'raulsanoli77@gmail.com';

        try {
          const fallbackRes = await resend.emails.send({
            from: DEFAULT_FROM,
            to: [ownerEmail],
            subject: `[PRUEBA RESEND - Destinado a: ${destinatarios.join(', ')}] Nueva Solicitud #${params.folio.replace(/^COT-/i, '')} | ${params.lead.empresa}`,
            html: `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 14px; margin-bottom: 16px; border-radius: 8px; font-family: sans-serif; font-size: 13px; color: #92400e;">
                <strong>⚠️ NOTIFICACIÓN EN MODO PRUEBA (RESEND SANDBOX):</strong><br/>
                Esta cotización estaba destinada a los correos: <strong>${destinatarios.join(', ')}</strong>.<br/>
                Resend la entregó aquí (<code>${ownerEmail}</code>) porque tu dominio corporativo aún no está verificado en <a href="https://resend.com/domains" target="_blank" style="color: #b45309; font-weight: bold;">resend.com/domains</a>.<br/>
                En cuanto agregues y verifiques tu dominio en Resend, los correos saldrán directamente a cualquier vendedor (Hotmail, Outlook, etc.) y a los clientes.
              </div>
              ${generarHTMLNotificacion(params)}
            `,
          });
          if (!fallbackRes.error) {
            console.log('[Email] Notificación entregada en modo prueba a:', ownerEmail);
            return { success: true };
          }
        } catch (fallbackErr) {
          console.error('[Email] Error en fallback de pruebas:', fallbackErr);
        }
      }

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
  const folioLimpio = escapeHtml(params.folio.replace(/^COT-/i, ''));
  const mensajeWA = `Hola ${params.lead.nombre_completo}, te contacto de REM Industrial sobre tu solicitud de cotización folio ${params.folio.replace(/^COT-/i, '')}`;

  const filasPartidas = params.partidas
    .map(
      (p, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px; text-align: center; font-size: 13px;">${i + 1}</td>
        <td style="padding: 8px; font-size: 13px;">${Number(p.cantidad)}</td>
        <td style="padding: 8px; font-size: 13px; font-weight: 600;">${escapeHtml(p.marca)}</td>
        <td style="padding: 8px; font-size: 13px;">${escapeHtml(p.numero_parte)}</td>
        <td style="padding: 8px; font-size: 13px;">${escapeHtml(p.descripcion)}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px;">$${Number(p.precio_unitario).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: 600;">$${Number(p.total).toFixed(2)}</td>
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
          <td style="font-size: 13px;"><strong>Folio Solicitud:</strong> #${folioLimpio}</td>
          <td style="font-size: 13px; text-align: right;"><strong>Fecha:</strong> ${escapeHtml(params.fecha)}</td>
        </tr>
      </table>

      <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px; font-size: 14px; color: #2563eb;">Datos del Cliente</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${escapeHtml(params.lead.nombre_completo)}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Empresa:</strong> ${escapeHtml(params.lead.empresa)}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(params.lead.email)}">${escapeHtml(params.lead.email)}</a></p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Teléfono:</strong> ${escapeHtml(params.lead.telefono)}</p>
        ${params.vendedor ? `<p style="margin: 4px 0; font-size: 13px; color: #047857;"><strong>Asesor Comercial Asignado:</strong> ${escapeHtml(params.vendedor.nombre)} (${escapeHtml(params.vendedor.email)} / ${escapeHtml(params.vendedor.telefono)})</p>` : ''}
        ${params.lead.direccion ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Envío a:</strong> ${escapeHtml(params.lead.direccion)}</p>` : ''}
        ${params.lead.telefono ? `
        <div style="margin-top: 10px;">
          <a href="https://wa.me/52${params.lead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWA)}" style="display: inline-block; background: #16a34a; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">
            💬 Contactar por WhatsApp al Cliente
          </a>
        </div>` : ''}
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
            <td colspan="6" style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 14px;">Subtotal (${escapeHtml(params.moneda)}):</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: bold; font-size: 14px;">$${Number(params.subtotal).toFixed(2)}</td>
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

/**
 * Envía un correo al cliente informándole que su cuenta ha sido aprobada.
 */
export async function enviarNotificacionAprobacion(
  destinatario: string,
  nombre: string,
  appUrl: string,
  terminosPago: string
) {
  try {
    const safeNombre = escapeHtml(nombre);
    const safeTerminos = escapeHtml(terminosPago);
    const safeDest = escapeHtml(destinatario);
    const safeUrl = escapeHtml(appUrl);
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM, // Importante: Configura tu dominio real en Resend
      to: [destinatario],
      subject: '¡Tu cuenta empresarial en REM Industrial ha sido aprobada!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f172a;">¡Hola ${safeNombre}!</h2>
          <p>Nos complace informarte que tu cuenta en el <strong>Portal de Clientes de REM Industrial</strong> ha sido aprobada.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Tus términos comerciales:</strong> ${safeTerminos}</p>
          </div>

          <p>A partir de este momento puedes iniciar sesión para acceder a tu catálogo con precios especiales y gestionar tus cotizaciones formales.</p>
          
          <p><strong>Información de Acceso:</strong></p>
          <ul>
            <li><strong>Enlace:</strong> <a href="${safeUrl}/admin/login">${safeUrl}/admin/login</a></li>
            <li><strong>Usuario:</strong> ${safeDest}</li>
            <li><strong>Contraseña:</strong> <em>La que creaste al momento de registrarte</em>.</li>
          </ul>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${safeUrl}/admin/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Iniciar Sesión Ahora
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">
            *Por motivos de seguridad, nosotros no tenemos acceso a tu contraseña. Si no la recuerdas, podrás usar la opción de "Recuperar Contraseña" en la pantalla de inicio de sesión próximamente.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('[Resend Aprobacion] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Resend Aprobacion] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Envía un correo al cliente informándole que su solicitud ha sido rechazada.
 */
export async function enviarNotificacionRechazo(
  destinatario: string,
  nombre: string
) {
  try {
    const safeNombre = escapeHtml(nombre);
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM, // Importante: Configura tu dominio real en Resend
      to: [destinatario],
      subject: 'Actualización sobre tu solicitud de cuenta en REM Industrial',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f172a;">Hola ${safeNombre},</h2>
          <p>Gracias por tu interés en registrarte en el Portal de Clientes de REM Industrial.</p>
          <p>Después de revisar tu solicitud, lamentamos informarte que en este momento <strong>no ha sido posible aprobar tu cuenta empresarial</strong>.</p>
          <p>Si consideras que esto es un error o deseas proveer información adicional sobre tu empresa, por favor responde a este correo o contáctanos directamente a nuestro departamento de ventas.</p>
          <p>Agradecemos tu comprensión.</p>
          <br/>
          <p>Atentamente,<br/><strong>El equipo de REM Industrial</strong></p>
        </div>
      `
    });

    if (error) {
      console.error('[Resend Rechazo] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Resend Rechazo] Exception:', err);
    return { success: false, error: err.message };
  }
}


export async function enviarCorreoRevisionCliente(email: string, nombre: string, pedidoId: string, baseURL: string) {
  try {
    const safeNombre = escapeHtml(nombre);
    const safePedidoCorto = escapeHtml(pedidoId.split('-')[0]);
    const safePedidoId = escapeHtml(pedidoId);
    const safeBaseURL = escapeHtml(baseURL);
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [email],
      subject: `Tiempos de entrega asignados - Pedido ${pedidoId.split('-')[0]}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <div style="background: #0f172a; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">REM Industrial</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #f97316; margin-top: 0;">Tu pedido requiere revisión</h2>
          <p>Hola <strong>${safeNombre}</strong>,</p>
          <p>Hemos revisado tu orden <strong>${safePedidoCorto}</strong> y le hemos asignado los tiempos de entrega (ETA).</p>
          <p>En caso de no contar con existencia de algún producto original, nuestro equipo te ha sugerido una alternativa de catálogo equivalente.</p>
          <p>Por favor, entra a tu portal para revisar estos detalles y aprobar tu orden para que podamos procesarla inmediatamente.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeBaseURL}/cuenta/pedidos/${safePedidoId}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Revisar y Aprobar Orden
            </a>
          </div>

          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
            Si tienes alguna duda, puedes contactar a tu asesor de ventas respondiendo a este correo.
          </p>
        </div>
      </body>
      </html>
      `
    });
    
    if (error) console.error('[Email] Error al enviar correo de revisión:', error);
    return { success: !error };
  } catch (error) {
    console.error('[Email] Error inesperado:', error);
    return { success: false };
  }
}

/**
 * Envía un correo automático de confirmación al cliente cuando registra
 * una solicitud de cotización formal en el portal.
 * Incluye fallback automático a modo Sandbox mientras el dominio DNS no esté verificado.
 */
export async function enviarConfirmacionPedidoCliente(params: {
  cliente: {
    nombre_completo: string;
    empresa: string;
    email: string;
  };
  vendedor?: {
    nombre: string;
    email: string;
    telefono: string;
  } | null;
  partidas: Array<{
    cantidad: number;
    marca: string;
    numero_parte: string;
    descripcion: string;
    precio_unitario: number;
    total: number;
  }>;
  subtotal: number;
  iva: number;
  total: number;
  moneda: string;
  folio: string;
  pedidoId: string;
}): Promise<{ success: boolean }> {
  if (!params.cliente.email || params.cliente.email.includes('no-email.rem')) {
    return { success: false };
  }

  const folioLimpio = escapeHtml(params.folio.replace(/^COT-/i, ''));
  const safeNombre = escapeHtml(params.cliente.nombre_completo);
  const safeEmpresa = escapeHtml(params.cliente.empresa);
  const safeMoneda = escapeHtml(params.moneda);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cotizador-rem.vercel.app';

  const filasHtml = params.partidas
    .map(
      (p, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; text-align: center; font-size: 12px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px; font-size: 13px; font-weight: bold;">${escapeHtml(p.numero_parte)}</td>
        <td style="padding: 8px; font-size: 12px; color: #475569;">${escapeHtml(p.marca)}</td>
        <td style="padding: 8px; text-align: center; font-size: 13px;">${Number(p.cantidad)}</td>
        <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: bold;">$${Number(p.total).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #1e293b;">
    <div style="background: #0f172a; padding: 22px; border-radius: 10px 10px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 20px;">🔧 REM Industrial</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Confirmación de Solicitud de Cotización #${folioLimpio}</p>
    </div>

    <div style="background: #ffffff; padding: 22px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
      <p style="margin-top: 0; font-size: 14px;">Hola <strong>${safeNombre}</strong> (${safeEmpresa}),</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">
        Hemos recibido correctamente tu solicitud de cotización formal con el folio <strong>#${folioLimpio}</strong>. Nuestro equipo comercial ya está revisando existencias, tiempos de entrega y costos de flete para tu ubicación.
      </p>

      ${
        params.vendedor
          ? `
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 4px; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #047857;">Tu Asesor Comercial Asignado</p>
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #065f46;">${escapeHtml(params.vendedor.nombre)}</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">
          ✉️ ${escapeHtml(params.vendedor.email)} &nbsp;|&nbsp; 💬 WhatsApp: ${escapeHtml(params.vendedor.telefono)}
        </p>
      </div>`
          : ''
      }

      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #64748b;">#</th>
            <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">No. Parte</th>
            <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">Marca</th>
            <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #64748b;">Cant.</th>
            <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #64748b;">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${filasHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc;">
            <td colspan="4" style="padding: 8px; text-align: right; font-size: 12px; color: #475569;">Subtotal (${safeMoneda}):</td>
            <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: bold;">$${Number(params.subtotal).toFixed(2)}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td colspan="4" style="padding: 8px; text-align: right; font-size: 12px; color: #475569;">IVA (16%):</td>
            <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: bold;">$${Number(params.iva).toFixed(2)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td colspan="4" style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: bold;">Total Cotizado (${safeMoneda}):</td>
            <td style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: bold; color: #2563eb;">$${Number(params.total).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(appUrl)}/cuenta/pedidos/${escapeHtml(params.pedidoId)}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
          Ver Estatus de mi Solicitud en el Portal
        </a>
      </div>
    </div>
  </body>
  </html>`;

  try {
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [params.cliente.email],
      subject: `Confirmación de Solicitud #${params.folio.replace(/^COT-/i, '')} - REM Industrial`,
      html: htmlBody,
    });

    if (error) {
      if (
        error.message?.includes('testing emails to your own email address') ||
        error.message?.includes('verify a domain')
      ) {
        const match = error.message.match(/\(([^)]+)\)/);
        const ownerEmail = match ? match[1] : 'raulsanoli77@gmail.com';
        await resend.emails.send({
          from: DEFAULT_FROM,
          to: [ownerEmail],
          subject: `[COPIA PRUEBA CLIENTE: ${params.cliente.email}] Confirmación Solicitud #${params.folio.replace(/^COT-/i, '')}`,
          html: htmlBody,
        });
      }
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email Cliente] Error:', err);
    return { success: false };
  }
}
