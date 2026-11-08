import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para uso en componentes del navegador
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function syncAuthCookie(accessToken?: string | null) {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  if (accessToken) {
    document.cookie = `rem-auth-token=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax${secureFlag}`;
  } else {
    document.cookie = `rem-auth-token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  }
}

// Mantener sincronizada la cookie de sesión para que las Server Actions puedan validar el token en el servidor
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    syncAuthCookie(session?.access_token);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      syncAuthCookie(null);
    } else if (session?.access_token) {
      syncAuthCookie(session.access_token);
    }
  });
}

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
