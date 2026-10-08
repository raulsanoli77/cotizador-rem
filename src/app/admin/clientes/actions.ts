'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionAprobacion } from '@/lib/email/notifications';

export async function actualizarEstatusCliente(
  id: string,
  email: string,
  nombre: string,
  estatus: 'pendiente' | 'aprobado' | 'rechazado',
  terminos_pago: string
) {
  const supabase = createAdminClient();

  // 1. Actualizar base de datos
  const { error } = await supabase
    .from('perfiles_clientes')
    .update({ estatus, terminos_pago })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  // 2. Si es 'aprobado', enviar correo
  if (estatus === 'aprobado') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tu-sitio.com';
    try {
      await enviarNotificacionAprobacion(email, nombre, appUrl, terminos_pago);
    } catch (emailError) {
      console.error('Error al enviar correo de aprobación:', emailError);
      // No fallamos toda la transacción por el correo, pero lo loggeamos
    }
  }

  return { success: true };
}
