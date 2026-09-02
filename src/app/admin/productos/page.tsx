'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Producto } from '@/types';
import { Loader2, Plus, Edit, Trash2, ImageIcon, Eye, Search, ChevronLeft, ChevronRight, X, Save } from 'lucide-react';
import Link from 'next/link';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import { toggleProductoActivoServer, deleteProductoServer, updateProductoServer } from './actions';

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Buscador
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 50;

  // Modales
  const [modalDetalles, setModalDetalles] = useState<Producto | null>(null);
  const [modalEditar, setModalEditar] = useState<Producto | null>(null);
  const [editForm, setEditForm] = useState<Partial<Producto>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  // Resetear página si cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

  const fetchProductos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProductos(data as Producto[]);
    if (error) console.error('Error fetch productos:', error);
    setLoading(false);
  };

  const toggleActivo = async (id: string, actual: boolean) => {
    try {
      const nuevoEstado = !actual;
      await toggleProductoActivoServer(id, nuevoEstado);
      setProductos(productos.map(p => p.id === id ? { ...p, activo: nuevoEstado } : p));
    } catch (error: any) {
      alert('Error al cambiar el estado: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await deleteProductoServer(id);
      setProductos(productos.filter(p => p.id !== id));
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handleOpenEdit = (prod: Producto) => {
    setEditForm(prod);
    setModalEditar(prod);
  };

  const handleSaveEdit = async () => {
    if (!modalEditar) return;
    setGuardando(true);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...updateData } = editForm as any;

    try {
      await updateProductoServer(modalEditar.id, updateData);
      setProductos(productos.map(p => p.id === modalEditar.id ? { ...p, ...updateData } : p));
      setModalEditar(null);
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado
  const filtrados = productos.filter(p => {
    const matchBusqueda = 
      (p.sku_interno?.toLowerCase().includes(busqueda.toLowerCase()) || false) ||
      (p.numero_parte?.toLowerCase().includes(busqueda.toLowerCase()) || false) ||
      (p.marca?.toLowerCase().includes(busqueda.toLowerCase()) || false);
    
    const matchEstado = 
      filtroEstado === 'Todos' ? true : 
      filtroEstado === 'Activos' ? p.activo === true : 
      p.activo === false;

    return matchBusqueda && matchEstado;
  });

  const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
  const paginados = filtrados.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
        <div className="flex gap-3">
          <Link href="/admin/productos/imagenes" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
            <ImageIcon className="h-4 w-4" /> Gestor Imágenes
          </Link>
          <Link href="/admin/productos/nuevo" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
            <Plus className="h-4 w-4" /> Agregar Individual
          </Link>
          <Link href="/admin/carga-masiva" className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Importar Excel
          </Link>
        </div>
      </div>

      {/* Controles de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por SKU, Marca o No. Parte..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
          {['Todos', 'Activos', 'Inactivos'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado as any)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filtroEstado === estado ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium w-12 text-center">Img</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">No. Parte</th>
                  <th className="px-4 py-3 font-medium w-64">Descripción</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium text-right">Costo Base</th>
                  <th className="px-4 py-3 font-medium text-center">Estado</th>
                  <th className="px-4 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {paginados.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No se encontraron productos con estos filtros.</td></tr>
                ) : (
                  paginados.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-center">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt="Thumb" className="w-8 h-8 object-contain mx-auto rounded bg-white border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center mx-auto">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-bold text-gray-900">{prod.sku_interno}</td>
                      <td className="px-4 py-2 font-medium">{prod.marca}</td>
                      <td className="px-4 py-2 text-brand-700 font-mono text-xs">{prod.numero_parte}</td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-600 truncate max-w-[200px] xl:max-w-[300px]" title={formatearDescripcionProducto(prod as any)}>
                          {formatearDescripcionProducto(prod as any)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{prod.categoria}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">${prod.costo_base.toFixed(2)} {prod.moneda_costo}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => toggleActivo(prod.id, prod.activo)}
                          title="Clic para cambiar estado"
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border border-transparent cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${
                            prod.activo 
                            ? 'bg-green-100 text-green-800 hover:border-green-300' 
                            : 'bg-red-100 text-red-800 hover:border-red-300'
                          }`}
                        >
                          {prod.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setModalDetalles(prod)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver Detalles">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenEdit(prod)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Editar">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(prod.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
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

      {/* Paginación */}
      {!loading && totalPaginas > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{(paginaActual - 1) * itemsPorPagina + 1}</span> a <span className="font-medium">{Math.min(paginaActual * itemsPorPagina, filtrados.length)}</span> de <span className="font-medium">{filtrados.length}</span> resultados
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VER DETALLES COMPLETOS
          ========================================================================= */}
      {modalDetalles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-brand-600" />
                Detalles del Producto
              </h2>
              <button onClick={() => setModalDetalles(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center min-h-[200px]">
                  {modalDetalles.imagen_url ? (
                    <img src={modalDetalles.imagen_url} alt="Producto" className="max-w-full max-h-48 object-contain" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <span className="text-xs uppercase tracking-wider font-bold">Sin Imagen</span>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{modalDetalles.marca} • {modalDetalles.categoria}</span>
                        <h3 className="text-2xl font-black text-gray-900 font-mono mt-1">{modalDetalles.numero_parte}</h3>
                        <p className="text-sm font-bold text-brand-600 mt-1">SKU Interno: {modalDetalles.sku_interno}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Costo Proveedor</span>
                        <span className="text-2xl font-black text-gray-900">${modalDetalles.costo_base.toFixed(2)}</span>
                        <span className="text-sm font-bold text-gray-500 ml-1">{modalDetalles.moneda_costo}</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Descripción:</span>
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                        {formatearDescripcionProducto(modalDetalles as any)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                  Especificaciones Técnicas Ocultas
                </h4>
                {modalDetalles.especificaciones_tecnicas && Object.keys(modalDetalles.especificaciones_tecnicas).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(modalDetalles.especificaciones_tecnicas).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 border border-gray-100 p-3 rounded">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{key}</span>
                        <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay especificaciones en formato JSON para este producto.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDITAR PRODUCTO
          ========================================================================= */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-600" />
                Editar Producto
              </h2>
              <button onClick={() => setModalEditar(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">SKU Interno</label>
                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50" value={editForm.sku_interno || ''} disabled />
                  <span className="text-[10px] text-gray-500">No editable.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">No. Parte</label>
                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                    value={editForm.numero_parte || ''} onChange={e => setEditForm({...editForm, numero_parte: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Marca</label>
                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                    value={editForm.marca || ''} onChange={e => setEditForm({...editForm, marca: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Categoría</label>
                  <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                    value={editForm.categoria || ''} onChange={e => setEditForm({...editForm, categoria: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Costo Base</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                    value={editForm.costo_base || ''} onChange={e => setEditForm({...editForm, costo_base: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Moneda</label>
                  <select className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                    value={editForm.moneda_costo || 'USD'} onChange={e => setEditForm({...editForm, moneda_costo: e.target.value as 'USD'|'MXN'})}>
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Estado</label>
                  <select className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-bold" 
                    value={editForm.activo ? 'true' : 'false'} onChange={e => setEditForm({...editForm, activo: e.target.value === 'true'})}>
                    <option value="true">Activo (Visible)</option>
                    <option value="false">Inactivo (Oculto)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">URL de Imagen</label>
                <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                  value={editForm.imagen_url || ''} onChange={e => setEditForm({...editForm, imagen_url: e.target.value})} placeholder="https://..." />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setModalEditar(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={guardando} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
