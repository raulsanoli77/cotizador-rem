'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Save, X, GripVertical, Settings2, Tags } from 'lucide-react';
import Link from 'next/link';
import { getCategoriasServer, saveCategoriaServer, deleteCategoriaServer } from './actions';

interface CampoFiltro {
  nombre: string;
  tipo: 'texto' | 'seleccion';
  unidad?: string;
  opciones?: string[];
  opcionesText?: string; // Solo para estado local de la UI
}

interface Categoria {
  id: string;
  nombre: string;
  campos_filtro: CampoFiltro[];
}

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado del formulario
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCampos, setEditCampos] = useState<CampoFiltro[]>([]);

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

  const handleOpenNew = () => {
    setEditId(null);
    setEditNombre('');
    setEditCampos([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Categoria) => {
    setEditId(cat.id);
    setEditNombre(cat.nombre);
    // Transformamos las opciones a texto crudo para que el textarea funcione libremente
    setEditCampos((cat.campos_filtro || []).map(c => ({
      ...c,
      opcionesText: (c.opciones || []).join(', ')
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
      
      if (campo.tipo === 'seleccion') {
        // Convertimos el texto libre de regreso a un arreglo limpio
        const opcionesLimpio = (campo.opcionesText || '')
          .split(',')
          .map(s => s.trim())
          .filter(s => s !== '');
          
        if (opcionesLimpio.length === 0) {
          throw new Error(`El campo "${campo.nombre}" es de tipo selección y debe tener al menos una opción.`);
        }
        
        return { 
          nombre: campo.nombre, 
          tipo: campo.tipo, 
          unidad: campo.unidad, 
          opciones: opcionesLimpio 
        };
      }
      
      // Si es texto libre, no mandamos ni opciones ni opcionesText
      return { 
        nombre: campo.nombre, 
        tipo: campo.tipo, 
        unidad: campo.unidad 
      };
    });

    setSaving(true);
    try {
      await saveCategoriaServer(editId, {
        nombre: editNombre,
        campos_filtro: camposToSave
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
    setEditCampos([...editCampos, { nombre: '', tipo: 'texto', unidad: '', opcionesText: '' }]);
  };

  const removeCampo = (index: number) => {
    setEditCampos(editCampos.filter((_, i) => i !== index));
  };

  const updateCampo = (index: number, key: keyof CampoFiltro, value: any) => {
    const newCampos = [...editCampos];
    newCampos[index] = { ...newCampos[index], [key]: value };
    // Limpiar opciones si cambia a texto
    if (key === 'tipo' && value === 'texto') {
      delete newCampos[index].opciones;
      delete newCampos[index].opcionesText;
    }
    // Inicializar string vacío si cambia a selección
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
          <p className="text-sm text-gray-500 mt-1">Configura los menús desplegables y campos técnicos de tus productos.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Categoría
        </button>
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
                              {campo.tipo === 'seleccion' ? <Settings2 className="h-3 w-3 text-brand-600" /> : <Tags className="h-3 w-3 text-gray-400" />}
                              {campo.nombre} {campo.unidad && `(${campo.unidad})`}
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
          MODAL: EDITAR / CREAR CATEGORÍA
          ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            
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

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Campos Técnicos (Especificaciones)</h3>
                    <p className="text-sm text-gray-500">Configura la información que se le pedirá a los productos de esta categoría.</p>
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
                      <p className="text-sm text-gray-400 mt-1">Usa el botón de arriba para agregar "Flautas", "Recubrimiento", etc.</p>
                    </div>
                  ) : (
                    editCampos.map((campo, index) => (
                      <div key={index} className="flex flex-col gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                        
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nombre del Campo</label>
                            <input 
                              type="text" 
                              value={campo.nombre} 
                              onChange={e => updateCampo(index, 'nombre', e.target.value)}
                              placeholder="Ej. Recubrimiento"
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                          </div>
                          
                          <div className="w-40">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
                            <select 
                              value={campo.tipo} 
                              onChange={e => updateCampo(index, 'tipo', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                              <option value="texto">Texto Libre</option>
                              <option value="seleccion">Lista Desplegable</option>
                            </select>
                          </div>

                          <div className="w-32">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unidad <span className="font-normal text-gray-400">(Opcional)</span></label>
                            <input 
                              type="text" 
                              value={campo.unidad || ''} 
                              onChange={e => updateCampo(index, 'unidad', e.target.value)}
                              placeholder="ej. mm, in, °"
                              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                          </div>

                          <div className="pt-6">
                            <button 
                              onClick={() => removeCampo(index)}
                              className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200"
                              title="Quitar Campo"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Editor de Opciones para Dropdowns */}
                        {campo.tipo === 'seleccion' && (
                          <div className="bg-white p-4 rounded-lg border border-brand-100 shadow-sm mt-2">
                            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Settings2 className="h-4 w-4" />
                              Opciones de la lista desplegable
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Escribe las opciones separadas por una coma ( , ).</p>
                            <textarea 
                              rows={2}
                              value={campo.opcionesText ?? ''} 
                              onChange={e => updateCampo(index, 'opcionesText', e.target.value)}
                              placeholder="TiAlN, AlTiN, Sin Recubrimiento, Diamante"
                              className="w-full border border-brand-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-brand-50/30" 
                            />
                            
                            {/* Preview de Etiquetas (calculadas en tiempo real sin modificar el texto original) */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(campo.opcionesText || '').split(',').map(s => s.trim()).filter(s => s !== '').map((opt, optIdx) => (
                                <span key={optIdx} className="bg-brand-100 text-brand-800 border border-brand-200 px-2 py-1 rounded text-xs font-medium">
                                  {opt}
                                </span>
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
