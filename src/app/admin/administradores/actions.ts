'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { exigirAdminServerAction } from '@/lib/auth/admin-auth';
import { revalidatePath } from 'next/cache';

export type PerfilAdmin = {
  id: string;
  email: string;
  nombre_completo: string;
  fecha_registro: string;
  rol: string;
  foto_url?: string | null;
};

export async function obtenerAdministradores(): Promise<{
  success: boolean;
  data?: PerfilAdmin[];
  error?: string;
}> {
  try {
    await exigirAdminServerAction();
    const supabase = createAdminClient();

    const { data: admins, error } = await supabase
      .from('perfiles_clientes')
      .select('*')
      .eq('rol', 'admin')
      .order('fecha_registro', { ascending: true });

    if (error) throw new Error(error.message);

    // Obtener fotos desde auth.users solo para los admins que aún no tengan foto_url en la tabla
    const mapeados: PerfilAdmin[] = await Promise.all(
      (admins || []).map(async (a: any) => {
        let foto = a.foto_url || null;
        if (!foto) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(a.id);
            foto = authUser?.user?.user_metadata?.foto_url || null;
          } catch (_) {}
        }
        return {
          id: a.id,
          email: a.email,
          nombre_completo: a.nombre_completo,
          fecha_registro: a.fecha_registro,
          rol: a.rol,
          foto_url: foto,
        };
      })
    );

    return { success: true, data: mapeados };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function crearAdministrador(input: {
  nombre_completo: string;
  email: string;
  password: string;
  foto_url?: string | null;
}) {
  await exigirAdminServerAction();
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
      foto_url: input.foto_url || null,
    },
  });

  if (authError || !authData?.user) {
    throw new Error(authError?.message || 'Error al crear la cuenta en Supabase Auth.');
  }

  const userId = authData.user.id;

  const perfilData: any = {
    id: userId,
    email: emailLimpio,
    nombre_completo: nombreLimpio,
    empresa: 'REM Industrial',
    estatus: 'aprobado',
    rol: 'admin',
    terminos_pago: 'Contado',
    vendedor_id: null,
  };

  if (input.foto_url) {
    perfilData.foto_url = input.foto_url;
  }

  try {
    const { error: profileError } = await supabase
      .from('perfiles_clientes')
      .upsert(perfilData, { onConflict: 'id' });

    if (profileError) {
      if (profileError.message?.includes('foto_url')) {
        delete perfilData.foto_url;
        await supabase.from('perfiles_clientes').upsert(perfilData, { onConflict: 'id' });
      } else {
        throw profileError;
      }
    }
  } catch (err: any) {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (_) {}
    throw new Error('Error al guardar el perfil de administrador: ' + err.message);
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
    foto_url?: string | null;
  }
) {
  await exigirAdminServerAction();
  const nombreLimpio = (input.nombre_completo || '').trim();
  if (!nombreLimpio) {
    throw new Error('El nombre completo es obligatorio.');
  }

  const supabase = createAdminClient();

  const authUpdatePayload: any = {
    user_metadata: {
      nombre_completo: nombreLimpio,
      foto_url: input.foto_url || null,
    },
  };

  if (input.nueva_password && input.nueva_password.trim().length > 0) {
    if (input.nueva_password.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    authUpdatePayload.password = input.nueva_password.trim();
    authUpdatePayload.email_confirm = true;
  }

  try {
    await supabase.auth.admin.updateUserById(id, authUpdatePayload);
  } catch (authErr: any) {
    console.warn('Aviso al actualizar auth metadata:', authErr);
  }

  const updateData: any = {
    nombre_completo: nombreLimpio,
    empresa: 'REM Industrial',
    rol: 'admin',
    estatus: 'aprobado',
    vendedor_id: null,
    foto_url: input.foto_url || null,
  };

  const { error } = await supabase
    .from('perfiles_clientes')
    .update(updateData)
    .eq('id', id);

  if (error) {
    if (error.message?.includes('foto_url')) {
      delete updateData.foto_url;
      await supabase.from('perfiles_clientes').update(updateData).eq('id', id);
    } else {
      throw new Error('Error al actualizar administrador: ' + error.message);
    }
  }

  revalidatePath('/admin/administradores');
  return { success: true };
}

export async function eliminarAdministrador(id: string, currentUserId?: string) {
  const adminSesion = await exigirAdminServerAction();
  if (!id) {
    throw new Error('ID inválido.');
  }
  if (id === adminSesion.user.id || (currentUserId && id === currentUserId)) {
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
