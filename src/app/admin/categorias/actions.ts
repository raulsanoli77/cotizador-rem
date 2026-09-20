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
export async function autoSincronizarCamposServer(categoriaId: string, categoriaNombre: string) {
  const supabase = createAdminClient();
  
  // 1. Obtener la categoría actual
  const { data: categoria, error: catError } = await supabase
    .from('categorias')
    .select('campos_filtro')
    .eq('id', categoriaId)
    .single();
    
  if (catError) throw new Error(catError.message);
  
  const camposActuales = categoria.campos_filtro || [];
  const nombresActuales = new Set(camposActuales.map((c: any) => c.nombre.toUpperCase()));
  
  // 2. Buscar productos de esa categoría
  // Usamos ilike para ser insensibles a mayúsculas/minúsculas
  const { data: productos, error: prodError } = await supabase
    .from('productos')
    .select('especificaciones_tecnicas')
    .ilike('categoria', categoriaNombre)
    .limit(2500);
    
  if (prodError) throw new Error(prodError.message);
  
  // 3. Extraer keys
  const nuevasKeys = new Set<string>();
  productos.forEach(prod => {
    if (prod.especificaciones_tecnicas) {
      Object.keys(prod.especificaciones_tecnicas).forEach(key => {
        if (!nombresActuales.has(key.toUpperCase())) {
          nuevasKeys.add(key);
        }
      });
    }
  });
  
  if (nuevasKeys.size === 0) {
    return { success: true, count: 0, message: 'No se encontraron campos nuevos en los productos actuales.' };
  }
  
  // 4. Agregar nuevos campos
  const nuevosCampos = Array.from(nuevasKeys).map(key => ({
    nombre: key,
    tipo: 'texto',
    visible_en_filtros: true
  }));
  
  const camposFinales = [...camposActuales, ...nuevosCampos];
  
  // 5. Guardar
  const { error: updateError } = await supabase
    .from('categorias')
    .update({ campos_filtro: camposFinales })
    .eq('id', categoriaId);
    
  if (updateError) throw new Error(updateError.message);
  
  return { success: true, count: nuevasKeys.size, message: `Se agregaron ${nuevasKeys.size} campos nuevos automáticamente.` };
}
