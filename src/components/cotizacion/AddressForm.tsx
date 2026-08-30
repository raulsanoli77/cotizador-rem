'use client';

import { useState } from 'react';
import { MapPin, Building, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
  const { lead, registrarLead } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    codigo_postal: lead?.codigo_postal || '',
    direccion: lead?.direccion || '',
  });

  const handleChange = (field: 'codigo_postal' | 'direccion', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo_postal || !form.direccion) {
      setError('Todos los campos son obligatorios');
      return;
    }
    
    if (!lead) return; // shouldn't happen since this only renders if auth'd

    setLoading(true);
    try {
      // Re-register lead but this time with address added
      await registrarLead({
        nombre_completo: lead.nombre_completo,
        empresa: lead.empresa,
        email: lead.email,
        telefono: lead.telefono,
        codigo_postal: form.codigo_postal,
        direccion: form.direccion,
      });
      onSuccess();
    } catch {
      setError('Error al guardar dirección. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cotizar Envío</h2>
        <p className="text-sm text-gray-500 mb-6">
          Para calcular el flete y los tiempos de entrega, por favor proporciónanos tu dirección de envío.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Código Postal" 
              value={form.codigo_postal} 
              onChange={(e) => handleChange('codigo_postal', e.target.value)} 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea 
              placeholder="Dirección completa (Calle, Número, Colonia, Ciudad, Estado)" 
              value={form.direccion} 
              onChange={(e) => handleChange('direccion', e.target.value)} 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[100px]" 
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Procesando...' : 'Solicitar Cotización Formal'}
          </button>

          <button 
            type="button" 
            onClick={onCancel} 
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}
