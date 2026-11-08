'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { exigirAdminServerAction } from '@/lib/auth/admin-auth';

export async function getCategoriasServer() {
  await exigirAdminServerAction();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('categorias').select('*').order('nombre');
  if (error) throw new Error(error.message);
  return data;
}

export async function saveCategoriaServer(id: string | null, data: any) {
  await exigirAdminServerAction();
  const supabase = createAdminClient();
  if (id) {
    // 1. Obtener categoría previa para detectar si se eliminaron campos técnicos
    const { data: catPrevia } = await supabase
      .from('categorias')
      .select('nombre, campos_filtro')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('categorias').update(data).eq('id', id);
    if (error) throw new Error(error.message);

    // 2. Si la categoría tiene campos configurados, limpiar de los productos de esa categoría
    // cualquier campo que haya sido eliminado en el gestor de categorías
    const nuevosCampos: any[] = Array.isArray(data.campos_filtro) ? data.campos_filtro : [];
    const nombresPermitidos = new Set(
      nuevosCampos.map((c: any) => String(c.nombre || '').toUpperCase().trim())
    );
    // Siempre conservar llaves internas del sistema
    nombresPermitidos.add('REQUIERE_CONFIRMACION');
    nombresPermitidos.add('UNIDAD DE MEDIDA');

    const camposPrevios: any[] = Array.isArray(catPrevia?.campos_filtro) ? catPrevia.campos_filtro : [];
    const camposEliminados = new Set<string>();
    camposPrevios.forEach((c: any) => {
      const upper = String(c.nombre || '').toUpperCase().trim();
      if (upper && !nombresPermitidos.has(upper)) {
        camposEliminados.add(upper);
      }
    });

    const nombreCat = data.nombre || catPrevia?.nombre;
    if (nombreCat && (camposEliminados.size > 0 || nuevosCampos.length > 0)) {
      const { data: prods } = await supabase
        .from('productos')
        .select('id, especificaciones_tecnicas')
        .ilike('categoria', nombreCat)
        .limit(2500);

      if (prods && prods.length > 0) {
        const prodsParaActualizar: Array<{ id: string; especificaciones_tecnicas: Record<string, any> }> = [];
        for (const prod of prods) {
          const specs = prod.especificaciones_tecnicas || {};
          let modificado = false;
          const nuevasSpecs: Record<string, any> = {};

          for (const [k, v] of Object.entries(specs)) {
            const kUpper = k.toUpperCase().trim();
            // Si fue explícitamente eliminado o no está en la lista actual de campos de la categoría
            if (camposEliminados.has(kUpper) || (nuevosCampos.length > 0 && !nombresPermitidos.has(kUpper))) {
              modificado = true;
            } else {
              nuevasSpecs[k] = v;
            }
          }

          if (modificado) {
            prodsParaActualizar.push({ id: prod.id, especificaciones_tecnicas: nuevasSpecs });
          }
        }

        // Procesar en lotes controlados (CHUNK_SIZE = 50) para no saturar conexiones ni exceder timeouts
        const CHUNK_SIZE = 50;
        for (let i = 0; i < prodsParaActualizar.length; i += CHUNK_SIZE) {
          const chunk = prodsParaActualizar.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunk.map((item) =>
              supabase
                .from('productos')
                .update({ especificaciones_tecnicas: item.especificaciones_tecnicas })
                .eq('id', item.id)
            )
          );
        }
      }
    }
  } else {
    const { error } = await supabase.from('categorias').insert(data);
    if (error) throw new Error(error.message);
  }
  return true;
}

export async function deleteCategoriaServer(id: string) {
  await exigirAdminServerAction();
  const supabase = createAdminClient();
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
export async function autoSincronizarCamposServer(categoriaId: string, categoriaNombre: string) {
  await exigirAdminServerAction();
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
        if (key.toLowerCase() === 'requiere_confirmacion') return;
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
