'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Producto } from '@/types';
import { Loader2, Search, CheckSquare, Square, ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';

export default function GestorImagenes() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Estado para la subida
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (data) setProductos(data as Producto[]);
    setLoading(false);
  };

  const filteredProducts = productos.filter(p => 
    p.sku_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApplyImage = async () => {
    if (!imageUrl || selectedIds.size === 0) return;
    setApplying(true);

    const idsArray = Array.from(selectedIds);
    
    const { error } = await supabase
      .from('productos')
      .update({ imagen_url: imageUrl })
      .in('id', idsArray);

    if (error) {
      alert('Error al aplicar la imagen: ' + error.message);
    } else {
      alert(`Imagen aplicada a ${idsArray.length} productos con éxito.`);
      fetchProductos(); // Recargar para ver los cambios
      setSelectedIds(new Set());
      setImageUrl(null);
    }
    setApplying(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestor Masivo de Imágenes</h1>
        <p className="text-gray-500 mt-1">Sube una imagen y aplícala a múltiples productos al mismo tiempo.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Panel Izquierdo: Selección de Productos */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0">
          <div className="p-4 border-b flex gap-4 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por SKU, marca o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
              />
            </div>
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                <><CheckSquare className="w-5 h-5 text-brand-600" /> Desmarcar Todos</>
              ) : (
                <><Square className="w-5 h-5 text-gray-400" /> Marcar Todos</>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(prod => (
                <div 
                  key={prod.id}
                  onClick={() => toggleSelect(prod.id)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedIds.has(prod.id) ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="absolute top-3 right-3">
                    {selectedIds.has(prod.id) ? (
                      <CheckSquare className="w-5 h-5 text-brand-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.sku_interno} className="w-10 h-10 object-contain bg-white rounded border p-1" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{prod.sku_interno}</h4>
                      <span className="text-xs text-gray-500">{prod.marca}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 truncate">{prod.numero_parte}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 text-sm font-medium text-gray-700">
            {selectedIds.size} productos seleccionados
          </div>
        </div>

        {/* Panel Derecho: Subida y Aplicación */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900 mb-4 border-b pb-2">Imagen a Aplicar</h2>
          
          <ImageUploader 
            folder="productos"
            currentUrl={imageUrl}
            onUploadSuccess={(url) => setImageUrl(url)}
          />

          <div className="mt-8 flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Resumen de acción</h3>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Se actualizará la imagen de <strong>{selectedIds.size}</strong> productos.</li>
              <li>• Los productos seleccionados reemplazarán su imagen actual si ya tienen una.</li>
            </ul>

            <button
              onClick={handleApplyImage}
              disabled={applying || selectedIds.size === 0 || !imageUrl}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {applying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5" />}
              {applying ? 'Aplicando...' : 'Aplicar a Seleccionados'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
