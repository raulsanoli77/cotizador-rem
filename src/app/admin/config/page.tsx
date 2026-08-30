'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2 } from 'lucide-react';

export default function AdminConfig() {
  const [tcManual, setTcManual] = useState<number>(20.0);
  const [tcActivo, setTcActivo] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('configuracion').select('*').eq('clave', 'tipo_cambio_manual').single();
      if (data && data.valor) {
        const val = data.valor as { valor: number, activo: boolean };
        setTcManual(val.valor || 20.0);
        setTcActivo(val.activo || false);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMensaje(null);
    const { error } = await supabase
      .from('configuracion')
      .update({ valor: { valor: tcManual, activo: tcActivo } })
      .eq('clave', 'tipo_cambio_manual');
      
    if (error) {
      setMensaje({ texto: 'Error al guardar la configuración', tipo: 'error' });
    } else {
      setMensaje({ texto: 'Configuración guardada exitosamente', tipo: 'success' });
      setTimeout(() => setMensaje(null), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold border-b pb-3 mb-4">Tipo de Cambio</h2>
        
        <p className="text-sm text-gray-500 mb-6">
          Por defecto, el sistema obtiene el tipo de cambio automáticamente. 
          Activa el tipo de cambio manual para forzar un valor específico en todo el cotizador.
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={tcActivo} 
              onChange={(e) => setTcActivo(e.target.checked)}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
            />
            <span className="font-medium text-gray-700">Forzar Tipo de Cambio Manual</span>
          </label>

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Tipo de Cambio (MXN)</label>
            <div className="relative rounded-md shadow-sm w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={!tcActivo}
                value={tcManual}
                onChange={(e) => setTcManual(parseFloat(e.target.value))}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border disabled:bg-gray-100"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">MXN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-4">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Configuración
          </button>
          
          {mensaje && (
            <span className={`text-sm font-medium ${mensaje.tipo === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {mensaje.texto}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
