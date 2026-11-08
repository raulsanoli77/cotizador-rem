'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type PerfilAdmin = {
  id: string;
  email: string;
  nombre_completo: string;
  fecha_registro: string;
  rol: string;
};

export async function obtenerAdministradores(): Promise<{
  success: boolean;
  data?: PerfilAdmin[];
  error?: string;
}> {
  const supabase = createAdminClient();
  try {
    // Limpiar cualquier vendedor_id residual en cuentas admin
    await supabase
      .from('perfiles_clientes')
      .update({ vendedor_id: null })
      .eq('rol', 'admin')
      .not('vendedor_id', 'is', null);

    const { data, error } = await supabase
      .from('perfiles_clientes')
      .select('id, email, nombre_completo, fecha_registro, rol')
      .eq('rol', 'admin')
      .order('fecha_registro', { ascending: true });

    if (error) throw new Error(error.message);

    return { success: true, data: (data || []) as PerfilAdmin[] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function crearAdministrador(input: {
  nombre_completo: string;
  email: string;
  password: string;
}) {
  const nombreLimpio = (input.nombre_completo || '').trim();
  const emailLimpio = (input.email || '').trim().toLowerCase();
  const passwordLimpia = (input.password || '').trim();

  if (!nombreLimpio) {
    throw new Error('El nombre del administrador es obligatorio.');
  }
  if (!emailLimpio) {
    throw new Error('El correo electrónico es obligatorio.');
  }
  if (!passwordLimpia || passwordLimpia.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const supabase = createAdminClient();

  const { data: existente } = await supabase
    .from('perfiles_clientes')
    .select('id, email, rol')
    .ilike('email', emailLimpio)
    .maybeSingle();

  if (existente) {
    throw new Error(`El correo ${emailLimpio} ya está registrado en el sistema.`);
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: emailLimpio,
    password: passwordLimpia,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombreLimpio,
      empresa: 'REM Industrial',
      rol: 'admin',
      estatus: 'aprobado',
    },
  });

  if (authError || !authData?.user) {
    throw new Error(authError?.message || 'Error al crear la cuenta en Supabase Auth.');
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase
    .from('perfiles_clientes')
    .upsert(
      {
        id: userId,
        email: emailLimpio,
        nombre_completo: nombreLimpio,
        empresa: 'REM Industrial',
        estatus: 'aprobado',
        rol: 'admin',
        terminos_pago: 'Contado',
        vendedor_id: null,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (_) {}
    throw new Error('Error al guardar el perfil de administrador: ' + profileError.message);
  }

  revalidatePath('/admin/administradores');
  revalidatePath('/admin/clientes');
  return { success: true };
}

export async function actualizarAdministrador(
  id: string,
  input: {
    nombre_completo: string;
    nueva_password?: string;
  }
) {
  const nombreLimpio = (input.nombre_completo || '').trim();
  if (!nombreLimpio) {
    throw new Error('El nombre completo es obligatorio.');
  }

  const supabase = createAdminClient();

  if (input.nueva_password && input.nueva_password.trim().length > 0) {
    if (input.nueva_password.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    const { error: passError } = await supabase.auth.admin.updateUserById(id, {
      password: input.nueva_password.trim(),
      email_confirm: true,
    });
    if (passError) {
      throw new Error('Error al actualizar contraseña: ' + passError.message);
    }
  }

  const { error } = await supabase
    .from('perfiles_clientes')
    .update({
      nombre_completo: nombreLimpio,
      empresa: 'REM Industrial',
      rol: 'admin',
      estatus: 'aprobado',
      vendedor_id: null,
    })
    .eq('id', id);

  if (error) {
    throw new Error('Error al actualizar administrador: ' + error.message);
  }

  revalidatePath('/admin/administradores');
  return { success: true };
}

export async function eliminarAdministrador(id: string, currentUserId?: string) {
  if (!id) {
    throw new Error('ID inválido.');
  }
  if (currentUserId && id === currentUserId) {
    throw new Error('Por seguridad, no puedes eliminar tu propia cuenta activa.');
  }

  const supabase = createAdminClient();

  const { count } = await supabase
    .from('perfiles_clientes')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'admin');

  if ((count || 0) <= 1) {
    throw new Error('No puedes eliminar al único administrador del sistema.');
  }

  const { error } = await supabase
    .from('perfiles_clientes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Error al eliminar administrador: ' + error.message);
  }

  try {
    await supabase.auth.admin.deleteUser(id);
  } catch (_) {}

  revalidatePath('/admin/administradores');
  return { success: true };
}
