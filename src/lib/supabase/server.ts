import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cliente para uso en Server Components y Route Handlers
// Usa la anon key por defecto, respeta RLS
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
