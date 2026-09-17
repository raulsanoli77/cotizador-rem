import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Buscar la categoría ENDMILLS
    const { data: categorias, error: searchError } = await supabase
      .from('categorias')
      .select('id, nombre')
      .ilike('nombre', 'ENDMILLS');

    if (searchError) throw searchError;

    let categoriaId = null;
    if (categorias && categorias.length > 0) {
      categoriaId = categorias[0].id;
    }

    // Definición de los 22 campos técnicos extraídos del análisis
    const camposFiltro = [
      // MEDIDAS (Texto Libre) - Importantes para el usuario
      { nombre: 'DIAMETRO (D1)', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'CORTE (L1)', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'LARGO (L)', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'ZANCO (D)', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'RADIO', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'CHAFLAN', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'CUELLO REDUCIDO', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'LBS (L2)', tipo: 'texto', visible_en_filtros: false },

      // CLASIFICACIONES (Selección)
      { nombre: 'RECUBRIMIENTO', tipo: 'seleccion', opciones: ['SIN RECUBRIMIENTO', 'TiN', 'TiCN', 'AlTiN'], visible_en_filtros: true },
      { nombre: 'MATERIAL', tipo: 'seleccion', opciones: ['CARBURO'], visible_en_filtros: true },
      { nombre: 'TIPO DE FILO', tipo: 'seleccion', opciones: ['CUADRADO', 'BOLA', 'RADIO'], visible_en_filtros: true },
      { nombre: 'TIPO DE CORTADOR', tipo: 'seleccion', opciones: ['USO GENERAL', 'ALTO RENDIMIENTO', 'ALUMINIO'], visible_en_filtros: true },
      { nombre: 'FLAUTAS', tipo: 'seleccion', opciones: ['2', '3', '4', '5', '6'], visible_en_filtros: true },
      { nombre: 'SERIE', tipo: 'texto', visible_en_filtros: true },
      { nombre: 'ANGULO DE FLAUTA', tipo: 'texto', sufijo: '°', visible_en_filtros: true },
      { nombre: 'UNIDAD DE MEDIDA', tipo: 'seleccion', opciones: ['IN', 'MM'], visible_en_filtros: true },
      { nombre: 'DIRECCIÓN DE CORTE', tipo: 'seleccion', opciones: ['DERECHA (RH)', 'IZQUIERDA (LH)'], visible_en_filtros: false },

      // BOOLEANOS / ESTADO (Selección o Texto)
      { nombre: 'CORTE CENTRAL', tipo: 'seleccion', opciones: ['SI', 'NO', 'N/A'], visible_en_filtros: false },
      { nombre: 'WELDON', tipo: 'seleccion', opciones: ['SI', 'NO', 'N/A'], visible_en_filtros: false },
      { nombre: 'ROMPEVIRUTAS', tipo: 'seleccion', opciones: ['SI', 'NO', 'N/A'], visible_en_filtros: false },
      { nombre: 'Wiper Flat', tipo: 'seleccion', opciones: ['SI', 'NO', 'N/A'], visible_en_filtros: false },
      { nombre: 'CARACTERISTICA ESPECIAL', tipo: 'texto', visible_en_filtros: false }
    ];

    if (categoriaId) {
      // Actualizar existente
      const { error: updateError } = await supabase
        .from('categorias')
        .update({ campos_filtro: camposFiltro })
        .eq('id', categoriaId);
        
      if (updateError) throw updateError;
      return NextResponse.json({ message: 'Categoría ENDMILLS actualizada correctamente con 22 campos.' });
    } else {
      // Crear nueva
      const { error: insertError } = await supabase
        .from('categorias')
        .insert({
          nombre: 'ENDMILLS',
          campos_filtro: camposFiltro
        });
        
      if (insertError) throw insertError;
      return NextResponse.json({ message: 'Categoría ENDMILLS creada correctamente con 22 campos.' });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
