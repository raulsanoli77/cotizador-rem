'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionAprobacion, enviarNotificacionRechazo } from '@/lib/email/notifications';

export async function actualizarEstatusCliente(
  id: string,
  email: string,
  nombre: string,
  estatus: 'pendiente' | 'aprobado' | 'rechazado',
  terminos_pago: string,
  rol: string
) {
  const supabase = createAdminClient();

  // 1. Actualizar base de datos
  const { error } = await supabase
    .from('perfiles_clientes')
    .update({ estatus, terminos_pago, rol })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  // 2. Enviar correo dependiendo del nuevo estatus
  if (estatus === 'aprobado') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-sitio.com';
    try {
      await enviarNotificacionAprobacion(email, nombre, appUrl, terminos_pago);
    } catch (emailError) {
      console.error('Error al enviar correo de aprobación:', emailError);
    }
  } else if (estatus === 'rechazado') {
    try {
      await enviarNotificacionRechazo(email, nombre);
    } catch (emailError) {
      console.error('Error al enviar correo de rechazo:', emailError);
    }
  }

  return { success: true };
}
