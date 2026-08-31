'use client';

import { useState } from 'react';
import { MapPin, Building, Loader2, Home, Map, Navigation, AlignLeft } from 'lucide-react';
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
    colonia: '',
    calle: '',
    num_ext: '',
    num_int: '',
    entre_calles: '',
    especificaciones: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    if (!form.codigo_postal || !form.colonia || !form.calle || !form.num_ext) {
      setError('Por favor llena todos los campos obligatorios (*)');
      return;
    }
    
    if (!lead) return; 

    setLoading(true);
    try {
      // Ensamblar la dirección en un solo texto bien formateado
      let direccionEnsamblada = `Calle: ${form.calle} #${form.num_ext}`;
      if (form.num_int) direccionEnsamblada += ` Int: ${form.num_int}`;
      direccionEnsamblada += `\nColonia/Delegación: ${form.colonia}`;
      if (form.entre_calles) direccionEnsamblada += `\nEntre calles: ${form.entre_calles}`;
      if (form.especificaciones) direccionEnsamblada += `\nEspecificaciones: ${form.especificaciones}`;

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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos de Envío</h2>
        <p className="text-sm text-gray-500 mb-6">
          Para calcular correctamente el flete y los tiempos de entrega, necesitamos la dirección exacta. Los campos con (*) son obligatorios.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Código Postal *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ej. 11000" 
                  value={form.codigo_postal} 
                  onChange={(e) => handleChange('codigo_postal', e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Colonia o Delegación *</label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ej. Centro Histórico" 
                  value={form.colonia} 
                  onChange={(e) => handleChange('colonia', e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Calle *</label>
            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Nombre de la calle o avenida" 
                value={form.calle} 
                onChange={(e) => handleChange('calle', e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Número Exterior *</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Ej. 123" 
                  value={form.num_ext} 
                  onChange={(e) => handleChange('num_ext', e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Número Interior</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Opcional" 
                  value={form.num_int} 
                  onChange={(e) => handleChange('num_int', e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Entre Calles / Colindancias</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ej. Entre Av. Morelos y Calle Mina" 
                value={form.entre_calles} 
                onChange={(e) => handleChange('entre_calles', e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Especificaciones Adicionales</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea 
                placeholder="Color de la casa, zaguán, local comercial, indicaciones de llegada..." 
                value={form.especificaciones} 
                onChange={(e) => handleChange('especificaciones', e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px]" 
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
