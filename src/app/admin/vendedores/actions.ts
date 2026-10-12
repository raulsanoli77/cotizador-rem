'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type Vendedor = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
  created_at: string;
  clientes_count?: number;
};

export async function obtenerVendedores(): Promise<{ success: boolean; data?: Vendedor[]; error?: string }> {
  const supabase = createAdminClient();
  try {
    const { data: vendedores, error } = await supabase
      .from('vendedores')
      .select(`
        *,
        clientes:perfiles_clientes(id)
      `)
      .order('nombre', { ascending: true });

    if (error) throw new Error(error.message);

    const mapeados: Vendedor[] = (vendedores || []).map((v: any) => ({
      id: v.id,
      nombre: v.nombre,
      telefono: v.telefono,
      email: v.email,
      activo: v.activo,
      created_at: v.created_at,
      clientes_count: Array.isArray(v.clientes) ? v.clientes.length : 0,
    }));

    return { success: true, data: mapeados };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function crearVendedor(datos: {
  nombre: string;
  telefono: string;
  email: string;
}) {
  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from('vendedores')
      .insert({
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        email: datos.email.trim().toLowerCase(),
        activo: true,
      });

    if (error) throw new Error(error.message);

    revalidatePath('/admin/vendedores');
    revalidatePath('/admin/clientes');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function actualizarVendedor(
  id: string,
  datos: {
    nombre: string;
    telefono: string;
    email: string;
    activo: boolean;
  }
) {
  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .from('vendedores')
      .update({
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        email: datos.email.trim().toLowerCase(),
        activo: datos.activo,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/vendedores');
    revalidatePath('/admin/clientes');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function eliminarVendedor(id: string) {
  const supabase = createAdminClient();
  try {
    // 1. Desvincular de perfiles_clientes asignados
    await supabase
      .from('perfiles_clientes')
      .update({ vendedor_id: null })
      .eq('vendedor_id', id);

    // 2. Eliminar vendedor
    const { error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/vendedores');
    revalidatePath('/admin/clientes');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
