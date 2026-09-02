'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getCategoriasServer() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  if (error) throw new Error(error.message);
  return data;
}

export async function saveCategoriaServer(id: string | null, data: any) {
  const supabase = createAdminClient();
  if (id) {
    const { error } = await supabase.from('categorias').update(data).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('categorias').insert(data);
    if (error) throw new Error(error.message);
  }
  return true;
}

export async function deleteCategoriaServer(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
