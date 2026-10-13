import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verificarAdmin } from '@/lib/auth/admin-auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await verificarAdmin(request);
    if (!authCheck.autorizado) {
      return authCheck.errorResponse!;
    }

    const resolvedParams = await params;
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', resolvedParams.id);

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
