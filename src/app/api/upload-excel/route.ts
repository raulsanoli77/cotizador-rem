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

    // Obtener imágenes y especificaciones existentes para no sobreescribirlas (en chunks por si el excel es muy grande)
    const skus = productos.map(p => p.sku_interno);
    const chunkSize = 100;
    const productosExistentes: any[] = [];
    
    for (let i = 0; i < skus.length; i += chunkSize) {
      const chunk = skus.slice(i, i + chunkSize);
      const { data } = await supabase
        .from('productos')
        .select('sku_interno, imagen_url, especificaciones_tecnicas')
        .in('sku_interno', chunk);
      if (data) productosExistentes.push(...data);
    }
      
    const datosExistentesMap = new Map(
      productosExistentes?.map((p) => [p.sku_interno, p])
    );

    // Mapear el categoria_id y preservar imagen_url y specs antiguas
    const productosEnriquecidos = productos.map((p) => {
      const catId = categoriasMap.get(p.categoria.toLowerCase());
      const existente = datosExistentesMap.get(p.sku_interno);
      
      // Si el excel no trae imagen, pero en BD ya existe una, la preservamos
      let finalImageUrl = p.imagen_url;
      if (!finalImageUrl && existente?.imagen_url) {
        finalImageUrl = existente.imagen_url;
      }

      // Merge de especificaciones_tecnicas: 
      // Mantenemos lo que ya estaba en BD y sobreescribimos solo lo que venga en el Excel
      const mergedSpecs = {
        ...(existente?.especificaciones_tecnicas || {}),
        ...(p.especificaciones_tecnicas || {})
      };

      return {
        ...p,
        imagen_url: finalImageUrl,
        especificaciones_tecnicas: mergedSpecs,
        categoria_id: catId || null
      };
    });

    // Desduplicar el array basándonos en sku_interno
    // PostgreSQL lanza error si intentas hacer upsert del mismo SKU más de una vez en el mismo query
    const reporte: string[] = [];
    const productosDesduplicados = Object.values(
      productosEnriquecidos.reduce((acc, current) => {
        if (!acc[current.sku_interno]) {
          acc[current.sku_interno] = current;
        } else {
          reporte.push(`SKU duplicado omitido: ${current.sku_interno} (Se conservó la primera fila encontrada)`);
        }
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
      message: `Se procesaron ${data?.length || 0} productos correctamente.`,
      reporte
    });

  } catch (error) {
    console.error('[API/upload-excel] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
