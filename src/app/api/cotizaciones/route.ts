import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionVentas } from '@/lib/email/notifications';
import { recalcularPartidasServidor, generarSufijoFolio } from '@/lib/pricing/server-verifier';

async function verificarEsB2BDesdeRequest(request: NextRequest): Promise<boolean> {
  try {
    let token: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('rem-auth-token')?.value || null;
    }
    if (!token) return false;

    const supabase = createAdminClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return false;

    const { data: perfil } = await supabase
      .from('perfiles_clientes')
      .select('estatus')
      .eq('id', userData.user.id)
      .maybeSingle();

    return perfil?.estatus === 'aprobado';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lead_id,
      partidas,
      subtotal,
      moneda_venta,
      tipo_cambio_usado,
      formula_aplicada,
      lead_info,
      enviar_notificacion,
    } = body;

    if (!lead_id || !partidas || !Array.isArray(partidas) || partidas.length === 0) {
      return NextResponse.json(
        { error: 'Datos de cotización incompletos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const esB2B = await verificarEsB2BDesdeRequest(request);

    // Recalcular precios en el servidor desde la BD si las partidas incluyen producto_id
    let partidasFinales = partidas;
    let subtotalFinal = Number(subtotal) || 0;
    let monedaFinal = moneda_venta || 'MXN';
    let tcFinal = tipo_cambio_usado || null;

    const tieneProductoIds = partidas.every((p: any) => Boolean(p?.producto_id));
    if (tieneProductoIds) {
      const verificado = await recalcularPartidasServidor(partidas, esB2B);
      partidasFinales = verificado.partidas;
      subtotalFinal = verificado.subtotal;
      monedaFinal = verificado.moneda;
      tcFinal = verificado.tipoCambio;
    }

    const now = new Date();
    const year = now.getFullYear();

    // Generar e insertar folio con reintento ante colisión UNIQUE (23505)
    let data: any = null;
    let error: any = null;
    let folio = '';

    for (let intento = 0; intento < 3; intento++) {
      const timestamp = Date.now().toString().slice(-6);
      const sufijo = generarSufijoFolio(2);
      folio = `REM-${year}-${timestamp}${sufijo}`;

      const res = await supabase
        .from('cotizaciones')
        .insert({
          lead_id,
          folio,
          partidas: partidasFinales,
          subtotal: subtotalFinal,
          moneda_venta: monedaFinal,
          tipo_cambio_usado: tcFinal,
          formula_aplicada: null,
          estatus: enviar_notificacion ? 'solicitada' : 'borrador',
        })
        .select()
        .single();

      data = res.data;
      error = res.error;

      if (!error || error.code !== '23505') {
        break;
      }
    }

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

      let vendedorAsignado: { nombre: string; email: string; telefono: string } | null = null;
      if (lead_info.email && !lead_info.email.includes('no-email.rem')) {
        try {
          const { data: perfil } = await supabase
            .from('perfiles_clientes')
            .select('vendedor:vendedores(nombre, email, telefono, activo)')
            .ilike('email', String(lead_info.email).trim())
            .maybeSingle();
          const vendRaw = Array.isArray((perfil as any)?.vendedor)
            ? (perfil as any).vendedor[0]
            : (perfil as any)?.vendedor;
          if (vendRaw && vendRaw.activo !== false) {
            vendedorAsignado = {
              nombre: vendRaw.nombre,
              email: vendRaw.email,
              telefono: vendRaw.telefono,
            };
          }
        } catch {
          // Si no se encuentra perfil, continuar con asesor por defecto
        }
      }

      try {
        await enviarNotificacionVentas({
          lead: lead_info,
          vendedor: vendedorAsignado,
          partidas: partidasFinales,
          subtotal: subtotalFinal,
          moneda: monedaFinal,
          folio,
          fecha,
        });
      } catch (err) {
        console.error('[API/cotizaciones] Error enviando email:', err);
      }
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
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
