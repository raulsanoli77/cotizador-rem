'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { enviarNotificacionAprobacion, enviarNotificacionRechazo } from '@/lib/email/notifications';

export async function actualizarEstatusCliente(
  id: string,
  email: string,
  nombre: string,
  estatus: 'pendiente' | 'aprobado' | 'rechazado',
  terminos_pago: string,
  rol: string,
  descuento_porcentaje: number,
  calle: string,
  num_exterior: string,
  num_interior: string,
  colonia: string,
  ciudad: string,
  estado: string,
  codigo_postal: string,
  nombre_completo: string,
  puesto: string,
  empresa: string,
  perfil_empresa: string,
  telefono: string,
  rfc: string,
  pagina_web: string,
  vendedor_id?: string | null,
  nueva_password?: string
) {
  const supabase = createAdminClient();

  // 0. Si el admin especificó una nueva contraseña para el cliente, actualizarla en Supabase Auth
  if (nueva_password && nueva_password.trim().length > 0) {
    if (nueva_password.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const { error: passError } = await supabase.auth.admin.updateUserById(id, {
      password: nueva_password.trim(),
      email_confirm: true,
    });
    if (passError) {
      throw new Error('Error al actualizar la contraseña del cliente: ' + passError.message);
    }
  }

  // 1. Actualizar base de datos
  const { error } = await supabase
    .from('perfiles_clientes')
    .update({ 
      estatus, 
      terminos_pago, 
      rol,
      descuento_porcentaje,
      calle,
      num_exterior,
      num_interior,
      colonia,
      ciudad,
      estado,
      codigo_postal,
      nombre_completo,
      puesto,
      empresa,
      perfil_empresa,
      telefono,
      rfc,
      pagina_web,
      vendedor_id: vendedor_id || null
    })
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

export async function eliminarCliente(id: string, currentUserId?: string) {
  if (!id) {
    throw new Error('ID de cliente inválido.');
  }

  if (currentUserId && id === currentUserId) {
    throw new Error('Por seguridad, no puedes eliminar tu propia cuenta de administrador activa.');
  }

  const supabase = createAdminClient();

  // 1. Limpiar pedidos y partidas asociadas a este cliente (para evitar bloqueo por llaves foráneas)
  const { data: pedidosCliente } = await supabase
    .from('pedidos')
    .select('id')
    .eq('cliente_id', id);

  if (pedidosCliente && pedidosCliente.length > 0) {
    const pedidoIds = pedidosCliente.map((p) => p.id);
    await supabase.from('partidas_pedido').delete().in('pedido_id', pedidoIds);
    await supabase.from('pedidos').delete().eq('cliente_id', id);
  }

  // 2. Eliminar perfil de la tabla perfiles_clientes
  const { error: errorPerfil } = await supabase
    .from('perfiles_clientes')
    .delete()
    .eq('id', id);

  if (errorPerfil) {
    throw new Error('Error al eliminar el perfil del cliente: ' + errorPerfil.message);
  }

  // 3. Eliminar usuario de Supabase Auth para liberar su correo electrónico
  try {
    await supabase.auth.admin.deleteUser(id);
  } catch (authErr) {
    console.warn('Aviso al eliminar usuario de Auth (puede no existir):', authErr);
  }

  return { success: true };
}

export interface CrearClienteAdminInput {
  email: string;
  password: string;
  nombre_completo: string;
  empresa: string;
  puesto?: string;
  perfil_empresa?: string;
  telefono?: string;
  rfc?: string;
  pagina_web?: string;
  estatus?: 'pendiente' | 'aprobado' | 'rechazado';
  terminos_pago?: string;
  rol?: string;
  descuento_porcentaje?: number;
  vendedor_id?: string | null;
  codigo_postal?: string;
  estado?: string;
  ciudad?: string;
  colonia?: string;
  calle?: string;
  num_exterior?: string;
  num_interior?: string;
  enviar_correo?: boolean;
}

export async function crearClienteAdmin(input: CrearClienteAdminInput) {
  const emailLimpio = (input.email || '').trim().toLowerCase();
  const passwordLimpia = (input.password || '').trim();
  const nombreLimpio = (input.nombre_completo || '').trim();
  const empresaLimpia = (input.empresa || '').trim();

  if (!emailLimpio) {
    throw new Error('El correo electrónico es obligatorio.');
  }
  if (!passwordLimpia || passwordLimpia.length < 6) {
    throw new Error('La contraseña inicial debe tener al menos 6 caracteres.');
  }
  if (!nombreLimpio) {
    throw new Error('El nombre completo del contacto es obligatorio.');
  }
  if (!empresaLimpia) {
    throw new Error('El nombre de la empresa es obligatorio.');
  }

  const supabase = createAdminClient();

  // Verificar si ya existe un perfil con ese correo
  const { data: existente } = await supabase
    .from('perfiles_clientes')
    .select('id, email')
    .ilike('email', emailLimpio)
    .maybeSingle();

  if (existente) {
    throw new Error(`Ya existe un cliente registrado con el correo ${emailLimpio}.`);
  }

  const estatusFinal = input.estatus || 'aprobado';
  const terminosFinal = input.terminos_pago || 'Contado';
  const rolFinal = input.rol || 'cliente';

  // 1. Crear usuario en Supabase Auth con email confirmado inmediatamente
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: emailLimpio,
    password: passwordLimpia,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombreLimpio,
      puesto: input.puesto || '',
      empresa: empresaLimpia,
      perfil_empresa: input.perfil_empresa || 'Usuario Final (Planta, Taller, Maquinados)',
      telefono: input.telefono || '',
      rfc: (input.rfc || '').toUpperCase(),
      pagina_web: input.pagina_web || '',
      codigo_postal: input.codigo_postal || '',
      ciudad: input.ciudad || '',
      estado: input.estado || '',
      colonia: input.colonia || null,
      calle: input.calle || null,
      num_exterior: input.num_exterior || null,
      num_interior: input.num_interior || null,
      estatus: estatusFinal === 'aprobado' ? 'aprobado' : 'pendiente_aprobacion',
    },
  });

  if (authError || !authData?.user) {
    const msg = authError?.message || 'No se pudo crear el usuario en Auth.';
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      throw new Error(`El correo ${emailLimpio} ya está registrado en el sistema de autenticación.`);
    }
    throw new Error(msg);
  }

  const userId = authData.user.id;

  // 2. Insertar / actualizar en perfiles_clientes
  const { error: profileError } = await supabase
    .from('perfiles_clientes')
    .upsert(
      {
        id: userId,
        email: emailLimpio,
        nombre_completo: nombreLimpio,
        puesto: input.puesto || '',
        empresa: empresaLimpia,
        perfil_empresa: input.perfil_empresa || 'Usuario Final (Planta, Taller, Maquinados)',
        telefono: input.telefono || '',
        rfc: (input.rfc || '').toUpperCase(),
        pagina_web: input.pagina_web || '',
        codigo_postal: input.codigo_postal || '',
        ciudad: input.ciudad || '',
        estado: input.estado || '',
        colonia: input.colonia || null,
        calle: input.calle || null,
        num_exterior: input.num_exterior || null,
        num_interior: input.num_interior || null,
        estatus: estatusFinal,
        terminos_pago: terminosFinal,
        rol: rolFinal,
        descuento_porcentaje: Number(input.descuento_porcentaje) || 0,
        vendedor_id: input.vendedor_id || null,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    // Rollback del usuario en Auth si falla la creación del perfil
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (_) {}
    throw new Error('Error al guardar el perfil del cliente: ' + profileError.message);
  }

  // 3. Opcionalmente enviar correo de notificación si está aprobado
  if (input.enviar_correo && estatusFinal === 'aprobado') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cotizador-rem.vercel.app';
    try {
      await enviarNotificacionAprobacion(emailLimpio, nombreLimpio, appUrl, terminosFinal);
    } catch (emailError) {
      console.error('Error al enviar correo de bienvenida:', emailError);
    }
  }

  return {
    success: true,
    userId,
  };
}
