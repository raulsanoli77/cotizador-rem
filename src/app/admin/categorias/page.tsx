'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Save, X, GripVertical, Settings2, Tags, Type, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { getCategoriasServer, saveCategoriaServer, deleteCategoriaServer } from './actions';
import { supabase } from '@/lib/supabase/client';

interface CampoFiltro {
  nombre: string;
  tipo: 'texto' | 'seleccion';
  sufijo?: string;
  opciones?: string[];
  opcionesText?: string;
  visible_en_filtros?: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
  campos_filtro: CampoFiltro[];
  imagen_url?: string;
}

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Estado del formulario
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCampos, setEditCampos] = useState<CampoFiltro[]>([]);
  const [editImagenUrl, setEditImagenUrl] = useState<string>('');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const data = await getCategoriasServer();
      setCategorias(data as Categoria[]);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingImage(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `cat_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `categorias/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      setEditImagenUrl(data.publicUrl);
    } catch (error: any) {
      alert('Error al subir imagen: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenNew = () => {
    setEditId(null);
    setEditNombre('');
    setEditImagenUrl('');
    setEditCampos([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    setEditImagenUrl(cat.imagen_url || '');
    // Migración: si un campo tiene la estructura vieja (unidadTipo, unidad), se migra a sufijo
    setEditCampos((cat.campos_filtro || []).map(c => ({
      nombre: c.nombre,
      tipo: c.tipo || 'texto',
      sufijo: c.sufijo || (c as any).unidad || '',
      opcionesText: (c.opciones || []).join(', '),
      opciones: c.opciones,
      visible_en_filtros: c.visible_en_filtros ?? true,
    })));
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Si hay productos usando esta categoría, podrías causar errores.')) return;
    try {
      await deleteCategoriaServer(id);
      setCategorias(categorias.filter(c => c.id !== id));
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handleSave = async () => {
    if (!editNombre.trim()) return alert('El nombre de la categoría es obligatorio.');
    
    // Validar y limpiar campos antes de guardar
    const camposToSave = editCampos.map(campo => {
      if (!campo.nombre.trim()) throw new Error('Todos los campos deben tener un nombre.');
      
      const payload: any = { 
        nombre: campo.nombre, 
        tipo: campo.tipo,
        visible_en_filtros: campo.visible_en_filtros ?? true
      };

      // Guardar sufijo solo si tiene valor
      if (campo.sufijo && campo.sufijo.trim()) {
        payload.sufijo = campo.sufijo.trim();
      }

      if (campo.tipo === 'seleccion') {
        const opcionesLimpio = (campo.opcionesText || '').split(',').map(s => s.trim()).filter(s => s !== '');
        if (opcionesLimpio.length === 0) throw new Error(`El campo "${campo.nombre}" es de tipo selección y debe tener al menos una opción.`);
        payload.opciones = opcionesLimpio;
      }
      
      return payload;
    });

    setSaving(true);
    try {
      await saveCategoriaServer(editId, {
        nombre: editNombre,
        campos_filtro: camposToSave,
        imagen_url: editImagenUrl || null
      });
      await fetchCategorias();
      setModalOpen(false);
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Funciones para manejar campos dinámicos
  const addCampo = () => {
    setEditCampos([...editCampos, { nombre: '', tipo: 'texto', sufijo: '', opcionesText: '', visible_en_filtros: true }]);
  };

  const removeCampo = (index: number) => {
    setEditCampos(editCampos.filter((_, i) => i !== index));
  };

  const moveCampo = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === editCampos.length - 1)) return;
    const newCampos = [...editCampos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newCampos[index];
    newCampos[index] = newCampos[targetIndex];
    newCampos[targetIndex] = temp;
    setEditCampos(newCampos);
  };

  const updateCampo = (index: number, key: keyof CampoFiltro, value: any) => {
    const newCampos = [...editCampos];
    newCampos[index] = { ...newCampos[index], [key]: value };
    
    // Limpiar opciones de tipo si cambia a texto
    if (key === 'tipo' && value === 'texto') {
      delete newCampos[index].opciones;
      delete newCampos[index].opcionesText;
    }
    // Inicializar opciones si cambia a selección
    if (key === 'tipo' && value === 'seleccion' && typeof newCampos[index].opcionesText === 'undefined') {
      newCampos[index].opcionesText = (newCampos[index].opciones || []).join(', ');
    }

    setEditCampos(newCampos);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor de Categorías y Atributos</h1>
          <p className="text-sm text-gray-500 mt-1">Configura los campos técnicos de tus productos por categoría.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch('/api/setup-endmills');
                if (!res.ok) throw new Error('Error en el setup');
                alert('¡Éxito! La categoría ENDMILLS ahora tiene los 22 campos exactos del Excel listos.');
                await fetchCategorias();
              } catch (error) {
                alert('Error configurando ENDMILLS');
              } finally {
                setLoading(false);
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Settings2 className="h-4 w-4" /> Auto-Configurar ENDMILLS (29 col)
          </button>
          <button 
            onClick={handleOpenNew}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nueva Categoría
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Nombre de la Categoría</th>
                  <th className="px-6 py-4 font-medium">Campos Dinámicos</th>
                  <th className="px-6 py-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {categorias.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No hay categorías configuradas.</td></tr>
                ) : (
                  categorias.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 text-base">{cat.nombre}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {cat.campos_filtro?.map((campo, idx) => (
                            <span key={idx} className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                              {campo.tipo === 'seleccion' ? <Settings2 className="h-3 w-3 text-brand-600" /> : <Type className="h-3 w-3 text-gray-400" />}
                              {campo.nombre}{campo.sufijo ? ` (${campo.sufijo})` : (campo as any).unidad ? ` (${(campo as any).unidad})` : ''}
                            </span>
                          ))}
                          {(!cat.campos_filtro || cat.campos_filtro.length === 0) && (
                            <span className="text-gray-400 text-xs italic">Sin campos adicionales</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenEdit(cat)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Configurar Opciones">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: EDITAR / CREAR CATEGORÍA (Simplificado)
          ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-brand-600" />
                {editId ? 'Configurar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Nombre de la Categoría</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-brand-500 outline-none shadow-sm" 
                  value={editNombre} 
                  onChange={e => setEditNombre(e.target.value)} 
                  placeholder="Ej. Machuelos, Insertos, Endmills..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">Imagen de la Categoría</label>
                <div className="flex flex-col gap-3">
                  {editImagenUrl && (
                    <div className="h-32 w-32 relative rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                      <img src={editImagenUrl} alt="Vista previa" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setEditImagenUrl('')}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded hover:bg-white text-red-500"
                        title="Eliminar imagen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50"
                  />
                  {uploadingImage && <span className="text-sm text-brand-600 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Subiendo imagen...</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">Opcional. Si no subes una imagen, el sistema mostrará un icono por defecto.</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Campos Técnicos (Especificaciones)</h3>
                    <p className="text-sm text-gray-500">Define los campos que necesitarás capturar por producto.</p>
                  </div>
                  <button 
                    onClick={addCampo}
                    className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" /> Agregar Campo
                  </button>
                </div>

                <div className="space-y-4">
                  {editCampos.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <p className="text-gray-500 font-medium">Esta categoría no tiene campos técnicos adicionales.</p>
                      <p className="text-sm text-gray-400 mt-1">Usa el botón de arriba para agregar &quot;Flautas&quot;, &quot;Recubrimiento&quot;, etc.</p>
                    </div>
                  ) : (
                    editCampos.map((campo, index) => (
                      <div key={index} className="flex flex-col gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                        
                        <div className="flex gap-3 items-end">
                          {/* Nombre del campo */}
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nombre del Campo</label>
                            <input 
                              type="text" 
                              value={campo.nombre} 
                              onChange={e => updateCampo(index, 'nombre', e.target.value)}
                              placeholder="Ej. Diámetro, Flautas, Ángulo"
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                          </div>
                          
                          {/* Tipo */}
                          <div className="w-36">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
                            <select 
                              value={campo.tipo} 
                              onChange={e => updateCampo(index, 'tipo', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                              <option value="texto">Texto Libre</option>
                              <option value="seleccion">Selección</option>
                            </select>
                          </div>

                          {/* Sufijo / Símbolo */}
                          <div className="w-28">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Sufijo</label>
                            <input 
                              type="text" 
                              value={campo.sufijo || ''} 
                              onChange={e => updateCampo(index, 'sufijo', e.target.value)}
                              placeholder="°, %, mm"
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-center font-mono" 
                            />
                          </div>

                          {/* Toggle Filtros */}
                          <div className="w-20 shrink-0">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">Filtro</label>
                            <div className="flex justify-center">
                              <input 
                                type="checkbox"
                                checked={campo.visible_en_filtros ?? true}
                                onChange={e => updateCampo(index, 'visible_en_filtros', e.target.checked)}
                                className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                                title="Mostrar como filtro en el catálogo"
                              />
                            </div>
                          </div>

                          {/* Botones de orden y eliminar */}
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="flex gap-1">
                              <button
                                onClick={() => moveCampo(index, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded-md transition-colors ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="Mover Arriba"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveCampo(index, 'down')}
                                disabled={index === editCampos.length - 1}
                                className={`p-1 rounded-md transition-colors ${index === editCampos.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
                                title="Mover Abajo"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeCampo(index)}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors w-full flex justify-center"
                              title="Quitar Campo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Previsualización del sufijo */}
                        {campo.sufijo && campo.sufijo.trim() && (
                          <p className="text-xs text-gray-500 ml-1">
                            Vista previa: <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">valor{campo.sufijo.trim()}</span>
                          </p>
                        )}

                        {/* Editor de Opciones (Si el TIPO es selección) */}
                        {campo.tipo === 'seleccion' && (
                          <div className="bg-white p-4 rounded-lg border border-brand-100 shadow-sm">
                            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Settings2 className="h-4 w-4" />
                              Opciones de Selección
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Escribe las opciones separadas por una coma ( , ).</p>
                            <textarea 
                              rows={2}
                              value={campo.opcionesText ?? ''} 
                              onChange={e => updateCampo(index, 'opcionesText', e.target.value)}
                              placeholder="Ej. TiAlN, AlTiN, Sin Recubrimiento"
                              className="w-full border border-brand-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-brand-50/30" 
                            />
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(campo.opcionesText || '').split(',').map(s => s.trim()).filter(s => s !== '').map((opt, optIdx) => (
                                <span key={optIdx} className="bg-brand-100 text-brand-800 border border-brand-200 px-2 py-1 rounded text-xs font-medium">{opt}</span>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
