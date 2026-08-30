import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_completo, empresa, email, telefono, direccion, codigo_postal } = body;

    if (!nombre_completo || !empresa) {
      return NextResponse.json(
        { error: 'Nombre y empresa son obligatorios' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Upsert por email: si ya existe actualiza, si no inserta
    const { data, error } = await supabase
      .from('leads')
      .upsert(
        { nombre_completo, empresa, email, telefono, direccion, codigo_postal },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('[API/leads] Error:', error);
      return NextResponse.json(
        { error: 'Error al guardar los datos' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/leads] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
