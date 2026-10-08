'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, Award } from 'lucide-react';

export default function MarcasAdminPage() {
  const [marcas, setMarcas] = useState<Record<string, string>>({});
  const [margenes, setMargenes] = useState<Record<string, number>>({});
  const [margenesPublico, setMargenesPublico] = useState<Record<string, number>>({});
  const [cruces, setCruces] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  // Formulario
  const [nombreMarca, setNombreMarca] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [margenUsa, setMargenUsa] = useState<number>(1.5);
  const [margenPub, setMargenPub] = useState<number>(1.35);
  const [aplicaCruce, setAplicaCruce] = useState<boolean>(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [marcaOriginal, setMarcaOriginal] = useState('');

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    setLoading(true);
    const [resLogos, resMargenes, resMargenesPub, resCruces] = await Promise.all([
      supabase.from('configuracion').select('valor').eq('clave', 'marcas_logos').maybeSingle(),
      supabase.from('configuracion').select('valor').eq('clave', 'marcas_margenes').maybeSingle(),
      supabase.from('configuracion').select('valor').eq('clave', 'marcas_margenes_publico').maybeSingle(),
      supabase.from('configuracion').select('valor').eq('clave', 'marcas_cruce_volumen').maybeSingle()
    ]);

    setMarcas(resLogos.data?.valor || {});
    setMargenes(resMargenes.data?.valor || {});
    setMargenesPublico(resMargenesPub.data?.valor || {});
    setCruces(resCruces.data?.valor || {});
    setLoading(false);
  };

  const handleOpenModal = (marca?: string, url?: string, margen?: number, margenP?: number, cruce?: boolean) => {
    if (marca) {
      setNombreMarca(marca);
      setMarcaOriginal(marca);
      setLogoUrl(url || '');
      setMargenUsa(margen ?? 1.5);
      setMargenPub(margenP ?? 1.35);
      setAplicaCruce(cruce ?? false);
      setModoEdicion(true);
    } else {
      setNombreMarca('');
      setLogoUrl('');
      setMargenUsa(1.5);
      setMargenPub(1.35);
      setAplicaCruce(false);
      setModoEdicion(false);
    }
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `marca_${Date.now()}.${fileExt}`;
      const filePath = `marcas/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
    } catch (error: any) {
      setMensaje({ texto: `Error al subir imagen: ${error.message}`, tipo: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nombreMarca.trim()) {
      setMensaje({ texto: 'El nombre de la marca es obligatorio', tipo: 'error' });
      return;
    }

    try {
      const nuevasMarcas = { ...marcas };
      const nuevosMargenes = { ...margenes };
      const nuevosMargenesPub = { ...margenesPublico };
      const nuevosCruces = { ...cruces };
      
      // Si estamos editando y cambió el nombre, eliminamos la anterior
      if (modoEdicion && marcaOriginal && marcaOriginal !== nombreMarca) {
        delete nuevasMarcas[marcaOriginal];
        delete nuevosMargenes[marcaOriginal];
        delete nuevosMargenesPub[marcaOriginal];
        delete nuevosCruces[marcaOriginal];
      }

      const marcaLimpia = nombreMarca.trim().toUpperCase();
      if (logoUrl.trim()) {
        nuevasMarcas[marcaLimpia] = logoUrl.trim();
      }
      nuevosMargenes[marcaLimpia] = Number(margenUsa);
      nuevosMargenesPub[marcaLimpia] = Number(margenPub);
      nuevosCruces[marcaLimpia] = Boolean(aplicaCruce);

      const [errLogos, errMargenes, errMargenesPub, errCruces] = await Promise.all([
        supabase.from('configuracion').upsert({ clave: 'marcas_logos', valor: nuevasMarcas }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_margenes', valor: nuevosMargenes }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_margenes_publico', valor: nuevosMargenesPub }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_cruce_volumen', valor: nuevosCruces }, { onConflict: 'clave' })
      ]);

      if (errLogos.error) throw errLogos.error;
      if (errMargenes.error) throw errMargenes.error;
      if (errMargenesPub.error) throw errMargenesPub.error;
      if (errCruces.error) throw errCruces.error;

      setMensaje({ texto: 'Marca guardada exitosamente', tipo: 'success' });
      setMarcas(nuevasMarcas);
      setMargenes(nuevosMargenes);
      setMargenesPublico(nuevosMargenesPub);
      setCruces(nuevosCruces);
      setModalOpen(false);
    } catch (error: any) {
      setMensaje({ texto: `Error al guardar: ${error.message}`, tipo: 'error' });
    }
  };

  const handleDelete = async (marca: string) => {
    if (!confirm(`¿Seguro que deseas eliminar la configuración de la marca ${marca}?`)) return;

    try {
      const nuevasMarcas = { ...marcas };
      const nuevosMargenes = { ...margenes };
      const nuevosMargenesPub = { ...margenesPublico };
      const nuevosCruces = { ...cruces };
      delete nuevasMarcas[marca];
      delete nuevosMargenes[marca];
      delete nuevosMargenesPub[marca];
      delete nuevosCruces[marca];

      const [errLogos, errMargenes, errMargenesPub, errCruces] = await Promise.all([
        supabase.from('configuracion').upsert({ clave: 'marcas_logos', valor: nuevasMarcas }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_margenes', valor: nuevosMargenes }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_margenes_publico', valor: nuevosMargenesPub }, { onConflict: 'clave' }),
        supabase.from('configuracion').upsert({ clave: 'marcas_cruce_volumen', valor: nuevosCruces }, { onConflict: 'clave' })
      ]);

      if (errLogos.error) throw errLogos.error;
      if (errMargenes.error) throw errMargenes.error;
      if (errMargenesPub.error) throw errMargenesPub.error;
      if (errCruces.error) throw errCruces.error;

      setMensaje({ texto: 'Marca eliminada exitosamente', tipo: 'success' });
      setMarcas(nuevasMarcas);
      setMargenes(nuevosMargenes);
      setMargenesPublico(nuevosMargenesPub);
      setCruces(nuevosCruces);
    } catch (error: any) {
      setMensaje({ texto: `Error al eliminar: ${error.message}`, tipo: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Combinar claves únicas de marcas y márgenes
  const allMarcasKeys = Array.from(new Set([...Object.keys(marcas), ...Object.keys(margenes), ...Object.keys(cruces)]));
  const marcasList = allMarcasKeys.sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Gestor de Marcas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus className="h-5 w-5" /> Agregar Marca
        </button>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg mb-6 ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {mensaje.texto}
        </div>
      )}

      {marcasList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Award className="h-16 w-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No hay marcas configuradas</h2>
          <p className="text-slate-500 mb-6">Sube los logos de las marcas que vendes para que aparezcan en el catálogo.</p>
          <button
            onClick={() => handleOpenModal()}
            className="text-brand-600 font-medium hover:text-brand-700"
          >
            Agregar mi primera marca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {marcasList.map((marca) => {
            const url = marcas[marca];
            const margen = margenes[marca] ?? 1.5;
            const margenP = margenesPublico[marca] ?? 1.35;
            const cruce = cruces[marca] ?? false;
            
            return (
            <div key={marca} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group">
              <div className="h-40 bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100 relative">
                {url ? (
                  <img src={url} alt={marca} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  <span className="bg-brand-100 text-brand-800 text-xs font-bold px-2 py-1 rounded">B2B: x{margen}</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Pub: x{margenP}</span>
                  {cruce && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">+12% Cruce</span>}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-white">
                <span className="font-bold text-slate-900 truncate pr-2">{marca}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(marca, url, margen, margenP, cruce)} className="p-1.5 text-slate-400 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 rounded">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(marca)} className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">
                {modoEdicion ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Bloque Fórmula Visual */}
              <div className="bg-slate-800 text-slate-100 p-4 rounded-lg font-mono text-sm shadow-inner">
                <p className="text-slate-400 mb-1 uppercase text-xs tracking-wider">Fórmula Aplicada (USD)</p>
                <div className="flex flex-wrap items-center gap-x-2">
                  <span>(Costo</span>
                  <span className="text-emerald-400">× 1.15</span>
                  <span className="text-sky-400">× {margenUsa || 1.5}</span>)
                  {aplicaCruce && <span className="text-amber-400 whitespace-nowrap">+ (Costo × 0.12)</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Marca</label>
                <input
                  type="text"
                  value={nombreMarca}
                  onChange={(e) => setNombreMarca(e.target.value)}
                  placeholder="Ej. GWS, OSG, KYOCERA"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase"
                />
                <p className="text-xs text-slate-500 mt-1">Debe coincidir exactamente con el nombre usado en el catálogo.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Multiplicador de Margen B2B (Base USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={margenUsa}
                  onChange={(e) => setMargenUsa(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-slate-500 mt-1">Ej. 1.5 es el valor B2B por defecto.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje Precio Público (Lista)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={margenPub}
                  onChange={(e) => setMargenPub(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-slate-500 mt-1">Ej. 1.35 multiplica el precio final B2B por 1.35 (35% más) para invitados.</p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    id="cruce"
                    type="checkbox"
                    checked={aplicaCruce}
                    onChange={(e) => setAplicaCruce(e.target.checked)}
                    className="w-4 h-4 text-brand-600 bg-white border-gray-300 rounded focus:ring-brand-500"
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="cruce" className="text-sm font-bold text-amber-900 cursor-pointer">
                    Aplicar +12% de recargo por Alto Volumen
                  </label>
                  <p className="text-xs text-amber-700 mt-1">
                    Ideal para Quantum Storage o marcas donde el flete impacta significativamente. Este costo se suma al final sin afectarse por el margen.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo de la Marca (Opcional si solo quieres cambiar margen)</label>
                
                {logoUrl && (
                  <div className="mb-4 h-32 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-4">
                    <img src={logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clic para subir</span></p>
                          <p className="text-xs text-slate-500">PNG, JPG, SVG o WEBP</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading}
                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold shadow-sm disabled:opacity-50 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
