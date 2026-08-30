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

    // Mapear el categoria_id
    const productosEnriquecidos = productos.map((p) => {
      const catId = categoriasMap.get(p.categoria.toLowerCase());
      return {
        ...p,
        categoria_id: catId || null
      };
    });

    // Upsert masivo (requiere que el array tenga la misma estructura y sku_interno sea unique)
    // Usamos onConflict para actualizar si el SKU ya existe
    const { data, error } = await supabase
      .from('productos')
      .upsert(productosEnriquecidos, { onConflict: 'sku_interno' })
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
