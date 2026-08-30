'use client';

import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const lead = useAuthStore((s) => s.lead);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const registrarLead = useAuthStore((s) => s.registrarLead);
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);

  return { lead, isAuthenticated, registrarLead, cerrarSesion };
}
