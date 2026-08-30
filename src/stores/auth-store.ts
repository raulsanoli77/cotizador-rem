import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lead, LeadFormData } from '@/types/lead';

interface AuthState {
  lead: Lead | null;
  isAuthenticated: boolean;
  registrarLead: (data: LeadFormData) => Promise<Lead>;
  cerrarSesion: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      lead: null,
      isAuthenticated: false,

      registrarLead: async (data: LeadFormData) => {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Error al registrar lead');
        }
        
        const leadData: Lead = await response.json();
        
        set({ lead: leadData, isAuthenticated: true });
        
        return leadData;
      },

      cerrarSesion: () => {
        set({ lead: null, isAuthenticated: false });
      },
    }),
    {
      name: 'rem-lead-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
