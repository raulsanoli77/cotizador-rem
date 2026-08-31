'use client';

import { useState } from 'react';
import { MapPin, Building, Loader2, Map } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface AddressFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddressForm({ onSuccess, onCancel }: AddressFormProps) {
  const lead = useAuthStore((s) => s.lead);
  const registrarLead = useAuthStore((s) => s.registrarLead);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    codigo_postal: lead?.codigo_postal || '',
    estado: '',
    ciudad: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    if (!form.codigo_postal || !form.estado || !form.ciudad) {
      setError('Por favor llena todos los campos para poder cotizar tu envío.');
      return;
    }
    
    if (!lead) return; 

    setLoading(true);
    try {
      // Ensamblar la dirección simple
      const direccionEnsamblada = `CP: ${form.codigo_postal}, ${form.ciudad}, ${form.estado}`;

      // Actualizar el lead en el estado global
      await registrarLead({
        nombre_completo: lead.nombre_completo,
        empresa: lead.empresa,
        email: lead.email,
        telefono: lead.telefono,
        codigo_postal: form.codigo_postal,
        direccion: direccionEnsamblada,
      });
      onSuccess();
    } catch {
      setError('Error al guardar dirección. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Destino de Envío</h2>
        <p className="text-sm text-gray-500 mb-6">
          Para cotizar el flete por paquetería, necesitamos saber a dónde se enviará tu pedido.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Código Postal</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ej. 11000" 
                value={form.codigo_postal} 
                onChange={(e) => handleChange('codigo_postal', e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
            <div className="relative">
              <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ej. Jalisco" 
                value={form.estado} 
                onChange={(e) => handleChange('estado', e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad o Municipio</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ej. Guadalajara" 
                value={form.ciudad} 
                onChange={(e) => handleChange('ciudad', e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3.5 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Procesando...' : 'Solicitar Cotización Formal'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-800 py-3 mt-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
