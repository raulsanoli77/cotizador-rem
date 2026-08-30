'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2, Paintbrush, Building2, Calculator, FileText } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminConfig() {
  const [tabActiva, setTabActiva] = useState<'apariencia' | 'empresa' | 'tipo_cambio' | 'pdf'>('apariencia');
  
  // Estados de Tipo de Cambio
  const [tcManual, setTcManual] = useState<number>(20.0);
  const [tcActivo, setTcActivo] = useState<boolean>(false);
  
  // Estados de Apariencia
  const [colorPrimario, setColorPrimario] = useState<string>('#1e40af');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tituloSitio, setTituloSitio] = useState<string>('REM Industrial');

  // Estados de Empresa / Contacto
  const [empresaDatos, setEmpresaDatos] = useState({
    nombre: '', rfc: '', direccion: '', telefono: '', email: ''
  });

  // Estados PDF
  const [pdfLegal, setPdfLegal] = useState<string>('Términos y condiciones sujetos a cambio sin previo aviso. Cotización válida por 15 días.');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string, tipo: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('configuracion').select('*');
      
      if (data) {
        data.forEach(item => {
          if (item.clave === 'tipo_cambio_manual') {
            setTcManual(item.valor?.valor || 20.0);
            setTcActivo(item.valor?.activo || false);
          }
          if (item.clave === 'apariencia') {
            setColorPrimario(item.valor?.color_primario || '#1e40af');
            setLogoUrl(item.valor?.logo_url || null);
            setTituloSitio(item.valor?.titulo || 'REM Industrial');
          }
          if (item.clave === 'empresa') {
            setEmpresaDatos({
              nombre: item.valor?.nombre || '',
              rfc: item.valor?.rfc || '',
              direccion: item.valor?.direccion || '',
              telefono: item.valor?.telefono || '',
              email: item.valor?.email || ''
            });
          }
          if (item.clave === 'pdf_config') {
            setPdfLegal(item.valor?.text_legal || '');
          }
        });
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMensaje(null);
    
    // Preparar guardado múltiple
    const upserts = [
      { clave: 'tipo_cambio_manual', valor: { valor: tcManual, activo: tcActivo } },
      { clave: 'apariencia', valor: { color_primario: colorPrimario, logo_url: logoUrl, titulo: tituloSitio } },
      { clave: 'empresa', valor: empresaDatos },
      { clave: 'pdf_config', valor: { text_legal: pdfLegal } }
    ];

    const { error } = await supabase.from('configuracion').upsert(upserts, { onConflict: 'clave' });
      
    if (error) {
      setMensaje({ texto: 'Error al guardar la configuración', tipo: 'error' });
    } else {
      setMensaje({ texto: 'Configuración guardada exitosamente', tipo: 'success' });
      setTimeout(() => setMensaje(null), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración del Sistema</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          <button onClick={() => setTabActiva('apariencia')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${tabActiva === 'apariencia' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Paintbrush className="w-5 h-5" /> Apariencia Web
          </button>
          <button onClick={() => setTabActiva('empresa')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${tabActiva === 'empresa' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Building2 className="w-5 h-5" /> Datos de Empresa
          </button>
          <button onClick={() => setTabActiva('pdf')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${tabActiva === 'pdf' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <FileText className="w-5 h-5" /> Configuración PDF
          </button>
          <button onClick={() => setTabActiva('tipo_cambio')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg ${tabActiva === 'tipo_cambio' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Calculator className="w-5 h-5" /> Reglas de Precio
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          
          {tabActiva === 'apariencia' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-lg font-semibold border-b pb-2">Branding y Logotipo</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo del Sistema</label>
                <ImageUploader 
                  folder="logos"
                  currentUrl={logoUrl}
                  onUploadSuccess={(url) => setLogoUrl(url)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título del Sitio (Pestaña del Navegador)</label>
                <input 
                  type="text" 
                  value={tituloSitio}
                  onChange={(e) => setTituloSitio(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color Principal (Botones y menú)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    className="h-10 w-16 p-1 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-500">{colorPrimario}</span>
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'empresa' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-lg font-semibold border-b pb-2">Datos Oficiales</h2>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial / Razón Social</label><input type="text" value={empresaDatos.nombre} onChange={(e) => setEmpresaDatos({...empresaDatos, nombre: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">RFC (Opcional)</label><input type="text" value={empresaDatos.rfc} onChange={(e) => setEmpresaDatos({...empresaDatos, rfc: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección Matriz</label><textarea value={empresaDatos.direccion} onChange={(e) => setEmpresaDatos({...empresaDatos, direccion: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" rows={3}></textarea></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Ventas</label><input type="text" value={empresaDatos.telefono} onChange={(e) => setEmpresaDatos({...empresaDatos, telefono: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Ventas</label><input type="email" value={empresaDatos.email} onChange={(e) => setEmpresaDatos({...empresaDatos, email: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" /></div>
              </div>
            </div>
          )}

          {tabActiva === 'pdf' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-lg font-semibold border-b pb-2">Cotizaciones PDF</h2>
              <p className="text-sm text-gray-500">Configura los textos legales que aparecerán al pie de cada cotización que descarguen tus clientes.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Términos, Condiciones y Vigencia</label>
                <textarea 
                  value={pdfLegal}
                  onChange={(e) => setPdfLegal(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm" 
                  rows={5}
                ></textarea>
              </div>
            </div>
          )}

          {tabActiva === 'tipo_cambio' && (
             <div className="space-y-6 max-w-lg">
               <h2 className="text-lg font-semibold border-b pb-2">Tipo de Cambio</h2>
               
               <p className="text-sm text-gray-500 mb-4">
                 Por defecto, el sistema obtiene el tipo de cambio automáticamente. 
                 Activa el tipo de cambio manual para forzar un valor específico en todo el cotizador.
               </p>
     
               <div className="space-y-4">
                 <label className="flex items-center space-x-3 cursor-pointer">
                   <input 
                     type="checkbox" 
                     checked={tcActivo} 
                     onChange={(e) => setTcActivo(e.target.checked)}
                     className="h-5 w-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500" 
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
                       className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border disabled:bg-gray-100"
                     />
                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                       <span className="text-gray-500 sm:text-sm" id="price-currency">MXN</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* Botón de Guardar General */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-4">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 disabled:bg-brand-400"
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
    </div>
  );
}
