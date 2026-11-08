import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminAuthResult {
  autorizado: boolean;
  user?: any;
  email?: string;
  nombre?: string;
  errorResponse?: NextResponse;
}

/**
 * Extrae el token Bearer desde headers o desde la cookie sincronizada `rem-auth-token`.
 */
async function obtenerTokenActual(request?: NextRequest): Promise<string | null> {
  if (request) {
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (headerToken) return headerToken;

    const reqCookie = request.cookies.get('rem-auth-token')?.value;
    if (reqCookie) return decodeURIComponent(reqCookie);
  }

  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const headerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (headerToken) return headerToken;
  } catch (_) {}

  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('rem-auth-token')?.value;
    if (cookieToken) return decodeURIComponent(cookieToken);
  } catch (_) {}

  return null;
}

/**
 * Valida en una Server Action ('use server') que quien la invoca tenga sesión activa
 * y rol 'admin' en 'perfiles_clientes'. Lanza Error si no está autorizado.
 */
export async function exigirAdminServerAction(): Promise<{
  user: any;
  email: string;
  nombre: string;
}> {
  const token = await obtenerTokenActual();
  if (!token) {
    throw new Error('Acceso no autorizado: Se requiere sesión activa de administrador.');
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error('Sesión inválida o expirada. Por favor recarga e inicia sesión nuevamente.');
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles_clientes')
    .select('rol, nombre_completo, email')
    .eq('id', user.id)
    .maybeSingle();

  if (perfilError || perfil?.rol !== 'admin') {
    throw new Error('Acceso denegado: Se requieren permisos de administrador.');
  }

  return {
    user,
    email: perfil.email || user.email || 'Admin',
    nombre: perfil.nombre_completo || 'Administrador',
  };
}

/**
 * Valida en una Server Action de cliente que el usuario tenga sesión activa
 * y que coincida con el `expectedUserId` (o sea administrador).
 */
export async function exigirSesionUsuarioServerAction(expectedUserId?: string): Promise<{
  user: any;
  esAdmin: boolean;
}> {
  const token = await obtenerTokenActual();
  if (!token) {
    throw new Error('Acceso no autorizado: Inicia sesión para realizar esta operación.');
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    throw new Error('Tu sesión ha expirado. Por favor vuelve a iniciar sesión.');
  }

  const { data: perfil } = await supabase
    .from('perfiles_clientes')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();

  const esAdmin = perfil?.rol === 'admin';
  if (expectedUserId && user.id !== expectedUserId && !esAdmin) {
    throw new Error('Acceso denegado: No tienes permiso para modificar datos de otro usuario.');
  }

  return { user, esAdmin };
}

/**
 * Valida que la petición API contenga un Bearer token (o cookie) válido perteneciente a un usuario
 * con rol de administrador en la tabla 'perfiles_clientes'.
 */
export async function verificarAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const token = await obtenerTokenActual(request);

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
