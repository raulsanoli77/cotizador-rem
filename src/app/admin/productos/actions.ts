'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function toggleProductoActivoServer(id: string, nuevoEstado: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('productos').update({ activo: nuevoEstado }).eq('id', id);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function deleteProductoServer(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('productos').delete().eq('id', id);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function updateProductoServer(id: string, data: any) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('productos').update(data).eq('id', id);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function bulkDeleteProductosServer(ids: string[]) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('productos').delete().in('id', ids);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

export async function bulkUpdateActivoServer(ids: string[], activo: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('productos').update({ activo }).in('id', ids);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}
