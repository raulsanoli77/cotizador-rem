'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { exigirAdminServerAction } from '@/lib/auth/admin-auth';

export async function obtenerConfiguracionesAdmin(claves?: string[]) {
  try {
    await exigirAdminServerAction();
    const supabase = createAdminClient();

    let query = supabase.from('configuracion').select('clave, valor');
    if (claves && claves.length > 0) {
      query = query.in('clave', claves);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener configuración' };
  }
}

export async function guardarConfiguracionesAdmin(
  entradas: Array<{ clave: string; valor: any }>
) {
  try {
    await exigirAdminServerAction();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('configuracion')
      .upsert(entradas, { onConflict: 'clave' });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al guardar configuración' };
  }
}
