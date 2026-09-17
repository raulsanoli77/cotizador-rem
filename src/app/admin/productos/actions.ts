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
  const chunkSize = 100;
  
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabase.from('productos').delete().in('id', chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
  
  return true;
}

export async function bulkUpdateActivoServer(ids: string[], activo: boolean) {
  const supabase = createAdminClient();
  const chunkSize = 100;
  
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabase.from('productos').update({ activo }).in('id', chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
  
  return true;
}

export async function deleteAllProductosServer() {
  const supabase = createAdminClient();
  // Using a filter that matches everything to delete all rows safely
  const { error } = await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}
