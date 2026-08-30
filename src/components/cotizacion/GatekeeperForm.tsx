'use client';

import { useState } from 'react';
import { User, Building2, Mail, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { LeadFormData } from '@/types/lead';

interface GatekeeperFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function GatekeeperForm({ onSuccess, onCancel }: GatekeeperFormProps) {
  const { registrarLead } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadFormData>({
    nombre_completo: '',
    empresa: '',
    email: '',
    telefono: '',
  });

  const handleChange = (field: keyof LeadFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_completo || !form.empresa || !form.email || !form.telefono) {
      setError('Todos los campos son obligatorios');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      await registrarLead(form);
      onSuccess();
    } catch {
      setError('Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Completa tus datos</h2>
        <p className="text-sm text-gray-500 mb-6">Para descargar tu cotización en PDF, necesitamos tus datos de contacto.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Nombre completo" value={form.nombre_completo} onChange={(e) => handleChange('nombre_completo', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Empresa" value={form.empresa} onChange={(e) => handleChange('empresa', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="email" placeholder="Correo electrónico corporativo" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="tel" placeholder="Teléfono" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Registrando...' : 'Continuar'}
          </button>

          {onCancel && (
            <button type="button" onClick={onCancel} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">Cancelar</button>
          )}
        </form>
      </div>
    </div>
  );
}
