import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productos } = body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json({ error: 'No hay productos para procesar' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Obtener IDs de categorías para referenciar correctamente
    const { data: categorias } = await supabase.from('categorias').select('id, nombre');
    const categoriasMap = new Map(categorias?.map((c) => [c.nombre.toLowerCase(), c.id]));

    // Obtener imágenes existentes para no sobreescribirlas (en chunks por si el excel es muy grande)
    const skus = productos.map(p => p.sku_interno);
    const chunkSize = 100;
    const productosExistentes: any[] = [];
    
    for (let i = 0; i < skus.length; i += chunkSize) {
      const chunk = skus.slice(i, i + chunkSize);
      const { data } = await supabase
        .from('productos')
        .select('sku_interno, imagen_url')
        .in('sku_interno', chunk);
      if (data) productosExistentes.push(...data);
    }
      
    const imagenesExistentesMap = new Map(
      productosExistentes?.map((p) => [p.sku_interno, p.imagen_url])
    );

    // Mapear el categoria_id y preservar imagen_url
    const productosEnriquecidos = productos.map((p) => {
      const catId = categoriasMap.get(p.categoria.toLowerCase());
      
      // Si el excel no trae imagen, pero en BD ya existe una, la preservamos
      let finalImageUrl = p.imagen_url;
      if (!finalImageUrl && imagenesExistentesMap.has(p.sku_interno)) {
        finalImageUrl = imagenesExistentesMap.get(p.sku_interno);
      }

      return {
        ...p,
        imagen_url: finalImageUrl,
        categoria_id: catId || null
      };
    });

    // Desduplicar el array basándonos en sku_interno
    // PostgreSQL lanza error si intentas hacer upsert del mismo SKU más de una vez en el mismo query
    const productosDesduplicados = Object.values(
      productosEnriquecidos.reduce((acc, current) => {
        acc[current.sku_interno] = current;
        return acc;
      }, {} as Record<string, any>)
    );

    // Upsert masivo (requiere que el array tenga la misma estructura y sku_interno sea unique)
    // Usamos onConflict para actualizar si el SKU ya existe
    const { data, error } = await supabase
      .from('productos')
      .upsert(productosDesduplicados, { onConflict: 'sku_interno' })
      .select('id');

    if (error) {
      console.error('[API/upload-excel] Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se procesaron ${data?.length || 0} productos correctamente.` 
    });

  } catch (error) {
    console.error('[API/upload-excel] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
