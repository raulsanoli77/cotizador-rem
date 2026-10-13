import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminAuthResult {
  autorizado: boolean;
  user?: any;
  email?: string;
  nombre?: string;
  errorResponse?: NextResponse;
}

/**
 * Valida que la petición contenga un Bearer token válido perteneciente a un usuario
 * con rol de administrador en la tabla 'perfiles_clientes'.
 */
export async function verificarAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return {
        autorizado: false,
        errorResponse: NextResponse.json(
          { error: 'Acceso no autorizado: Se requiere sesión activa de administrador.' },
          { status: 401 }
        ),
      };
    }

    const supabase = createAdminClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return {
        autorizado: false,
        errorResponse: NextResponse.json(
          { error: 'Sesión inválida o expirada. Por favor recarga e inicia sesión nuevamente.' },
          { status: 401 }
        ),
      };
    }

    // Verificar en perfiles_clientes si tiene rol 'admin'
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles_clientes')
      .select('rol, nombre_completo, email')
      .eq('id', user.id)
      .maybeSingle();

    if (perfilError || perfil?.rol !== 'admin') {
      return {
        autorizado: false,
        errorResponse: NextResponse.json(
          { error: 'Acceso denegado: Se requieren permisos de administrador.' },
          { status: 403 }
        ),
      };
    }

    return {
      autorizado: true,
      user,
      email: perfil.email || user.email || 'Admin',
      nombre: perfil.nombre_completo || 'Administrador',
    };
  } catch (err: any) {
    console.error('[verificarAdmin] Error inesperado:', err);
    return {
      autorizado: false,
      errorResponse: NextResponse.json(
        { error: 'Error del servidor al validar autorización: ' + (err.message || 'desconocido') },
        { status: 500 }
      ),
    };
  }
}
