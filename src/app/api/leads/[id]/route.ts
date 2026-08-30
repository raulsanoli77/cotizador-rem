import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('[API/leads/DELETE] Error:', error);
      return NextResponse.json(
        { error: 'Error al borrar el lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/leads/DELETE] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
