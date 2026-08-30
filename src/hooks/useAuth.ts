'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Lead, LeadFormData } from '@/types/lead';

const STORAGE_KEY = 'rem-lead-session';

export function useAuth() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Lead;
        setLead(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const registrarLead = useCallback(async (data: LeadFormData): Promise<Lead> => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al registrar lead');
    const leadData: Lead = await response.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leadData));
    setLead(leadData);
    setIsAuthenticated(true);
    return leadData;
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLead(null);
    setIsAuthenticated(false);
  }, []);

  return { lead, isAuthenticated, registrarLead, cerrarSesion };
}
