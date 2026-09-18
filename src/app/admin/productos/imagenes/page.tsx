'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Producto, CampoFiltro } from '@/types/product';
import { Loader2, Search, CheckSquare, Square, ImageIcon, Filter, Image as ImageIcon2, UploadCloud } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import FilterSidebar from '@/components/catalogo/FilterSidebar';

export default function GestorImagenes() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtrosActivos, setFiltrosActivos] = useState<Record<string, string[]>>({});
  
  // Selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Estado para la imagen a aplicar
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'gallery'>('upload');
  const [applying, setApplying] = useState(false);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    fetchProductos();
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data, error } = await supabase.storage
      .from('media')
      .list('productos', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
      
    if (data) {
      const urls = data
        .filter(f => f.name !== '.emptyFolderPlaceholder' && f.name)
        .map(f => supabase.storage.from('media').getPublicUrl(`productos/${f.name}`).data.publicUrl);
      setGalleryImages(urls);
    } else if (error) {
      console.error("Error fetching gallery:", error);
    }
  };

  const handleDeleteImage = async (urlToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione la imagen al darle clic a la tachita
    
    try {
      // 1. Auditoría: Revisar si la imagen está en uso
      const { count, error: countError } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('imagen_url', urlToDelete);

      if (countError) throw countError;

      if (count && count > 0) {
        const confirmInUse = confirm(`¡ALERTA DE SEGURIDAD!\n\nEsta imagen está actualmente asignada a ${count} producto(s) en tu catálogo.\n\nSi la eliminas, esos productos aparecerán con la imagen rota (error 404). Te recomendamos primero asignarles otra imagen antes de borrar esta.\n\n¿Aún así deseas FORZAR la eliminación y romper esos enlaces?`);
        if (!confirmInUse) return;
      } else {
        const confirmNormal = confirm('¿Estás seguro de eliminar esta imagen del servidor permanentemente?');
        if (!confirmNormal) return;
      }
      
      // Extraer el nombre del archivo de la URL
      const parts = urlToDelete.split('/');
      const fileName = parts[parts.length - 1];
      if(!fileName) return;

      const { error } = await supabase.storage.from('media').remove([`productos/${fileName}`]);
      if (error) throw error;
      
      setGalleryImages(prev => prev.filter(url => url !== urlToDelete));
      if (imageUrl === urlToDelete) setImageUrl(null);
      
    } catch (error: any) {
      alert('Error al realizar la operación: ' + error.message);
    }
  };

  const fetchProductos = async () => {
    setLoading(true);
    let allProductos: Producto[] = [];
    let hasMore = true;
    let from = 0;
    const step = 1000;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + step - 1);
        
      if (error) {
        console.error('Error fetching productos:', error);
        hasMore = false;
        break;
      }
      
      if (data && data.length > 0) {
        allProductos = [...allProductos, ...(data as Producto[])];
        from += step;
        if (data.length < step) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    setProductos(allProductos);
    setLoading(false);
  };

  // 1. Lógica de Filtrado Avanzado (Buscador + Sidebar)
  let filteredProducts = productos.filter(p => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const specsText = p.especificaciones_tecnicas ? Object.values(p.especificaciones_tecnicas).join(' ').toLowerCase() : '';
      const matchText = 
        p.sku_interno.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.numero_parte.toLowerCase().includes(q) ||
        specsText.includes(q);
      
      if (!matchText) return false;
    }
    return true;
  });

  Object.entries(filtrosActivos).forEach(([key, values]) => {
    if (values.length === 0) return;
    if (key === 'marca') {
      filteredProducts = filteredProducts.filter(p => values.includes(p.marca));
    } else if (key === 'categoria') {
      filteredProducts = filteredProducts.filter(p => values.includes(p.categoria));
    } else {
      filteredProducts = filteredProducts.filter(p => p.especificaciones_tecnicas && values.includes(String(p.especificaciones_tecnicas[key])));
    }
  });

  // 2. Extraer Opciones Dinámicas para la Barra de Filtros
  const marcasUnicas = new Set<string>();
  const categoriasUnicas = new Set<string>();
  const specsDinamic: Record<string, Set<string>> = {};

  productos.forEach(p => {
    if (p.marca) marcasUnicas.add(p.marca);
    if (p.categoria) categoriasUnicas.add(p.categoria);
    
    if (p.especificaciones_tecnicas) {
      Object.entries(p.especificaciones_tecnicas).forEach(([key, val]) => {
        if (!specsDinamic[key]) specsDinamic[key] = new Set();
        specsDinamic[key].add(String(val));
      });
    }
  });

  const opcionesDinamicas: Record<string, string[]> = {
    categoria: Array.from(categoriasUnicas).sort()
  };
  Object.entries(specsDinamic).forEach(([k, set]) => {
    opcionesDinamicas[k] = Array.from(set).sort();
  });

  const camposFiltro: CampoFiltro[] = [
    { nombre: 'categoria', tipo: 'texto', visible_en_filtros: true },
    ...Object.keys(specsDinamic).sort().map(k => ({ nombre: k, tipo: 'texto' as const, visible_en_filtros: true }))
  ];

  // 3. Ya no extraemos la galería de los productos, sino del Storage (fetchGallery)

  const handleFiltroChange = (nombre: string, valor: string) => {
    setFiltrosActivos((prev) => {
      const actuales = prev[nombre] || [];
      if (actuales.includes(valor)) {
        const nuevos = actuales.filter(v => v !== valor);
        if (nuevos.length === 0) {
          const next = { ...prev };
          delete next[nombre];
          return next;
        }
        return { ...prev, [nombre]: nuevos };
      } else {
        return { ...prev, [nombre]: [...actuales, valor] };
      }
    });
  };

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
    const chunkSize = 100; // Chunking to avoid URL length limit (Bad Request) on huge selections
    let hasError = false;
    let errorMessage = '';

    for (let i = 0; i < idsArray.length; i += chunkSize) {
      const chunk = idsArray.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('productos')
        .update({ imagen_url: imageUrl })
        .in('id', chunk);

      if (error) {
        hasError = true;
        errorMessage = error.message;
        break;
      }
    }

    if (hasError) {
      alert('Error al aplicar la imagen: ' + errorMessage);
    } else {
      alert(`Imagen aplicada a ${idsArray.length} productos con éxito.`);
      fetchProductos(); 
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
        <p className="text-gray-500 mt-1">Filtra tus productos con precisión y aplícales imágenes masivamente, subiendo nuevas o reusando existentes.</p>
      </div>

      <div className="flex gap-4 lg:gap-6 flex-1 min-h-0 items-stretch">
        
        {/* PANEL IZQUIERDO: Filtros (Oculto en móvil, asume admin en desktop) */}
        <div className="hidden lg:block">
          <FilterSidebar 
            campos={camposFiltro}
            filtrosActivos={filtrosActivos}
            onFiltroChange={handleFiltroChange}
            onLimpiarFiltros={() => setFiltrosActivos({})}
            marcas={Array.from(marcasUnicas).sort()}
            opcionesDinamicas={opcionesDinamicas}
          />
        </div>

        {/* PANEL CENTRAL: Productos y Búsqueda */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0">
          <div className="p-4 border-b flex gap-4 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por SKU, Serie, Medida, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 shrink-0"
            >
              {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                <><CheckSquare className="w-5 h-5 text-brand-600" /> Desmarcar Todos</>
              ) : (
                <><Square className="w-5 h-5 text-gray-400" /> Marcar Todos</>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              {filteredProducts.map(prod => (
                <div 
                  key={prod.id}
                  onClick={() => toggleSelect(prod.id)}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer bg-white transition-all ${selectedIds.has(prod.id) ? 'border-brand-500 shadow-md ring-1 ring-brand-500' : 'border-gray-200 hover:border-brand-300 shadow-sm'}`}
                >
                  <div className="absolute top-2 right-2">
                    {selectedIds.has(prod.id) ? (
                      <CheckSquare className="w-5 h-5 text-brand-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    {prod.imagen_url ? (
                      <img src={prod.imagen_url} alt={prod.sku_interno} className="w-12 h-12 object-contain bg-white rounded border border-gray-100 p-1 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{prod.numero_parte}</h4>
                      <span className="text-xs text-brand-600 font-semibold truncate block">{prod.sku_interno}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 flex gap-2 overflow-hidden">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[50%]">{prod.marca}</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[50%]">{prod.categoria}</span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  No se encontraron productos con estos filtros.
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t bg-white text-sm font-bold text-brand-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
            {selectedIds.size} productos seleccionados para actualizar
          </div>
        </div>

        {/* PANEL DERECHO: Subida y Aplicación */}
        <div className="w-64 xl:w-80 shrink-0 flex flex-col gap-4">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-h-full">
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button 
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${imageMode === 'upload' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <UploadCloud className="w-4 h-4" /> Subir
              </button>
              <button 
                onClick={() => setImageMode('gallery')}
                className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${imageMode === 'gallery' ? 'border-brand-600 text-brand-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <ImageIcon2 className="w-4 h-4" /> Galería
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {imageMode === 'upload' ? (
                <div className="flex flex-col gap-4">
                  <ImageUploader 
                    folder="productos"
                    currentUrl={imageUrl}
                    onUploadSuccess={(url) => setImageUrl(url)}
                  />
                  {imageUrl && (
                    <div className="text-xs text-center text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                      Imagen lista para aplicar
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.length === 0 ? (
                    <p className="col-span-2 text-xs text-gray-500 text-center py-8">No hay imágenes en el servidor.</p>
                  ) : (
                    galleryImages.map(url => (
                      <div 
                        key={url} 
                        onClick={() => setImageUrl(url)}
                        className={`group relative cursor-pointer rounded-lg border-2 p-1 transition-all ${imageUrl === url ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <button
                          onClick={(e) => handleDeleteImage(url, e)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                          title="Eliminar imagen permanentemente"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <img src={url} alt="Galeria" className="w-full h-20 object-contain bg-white rounded mix-blend-multiply" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Acción a realizar</h3>
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Asignarás la imagen seleccionada a los <strong>{selectedIds.size}</strong> productos marcados, reemplazando la actual si ya tenían una.
              </p>

              <button
                onClick={handleApplyImage}
                disabled={applying || selectedIds.size === 0 || !imageUrl}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-brand-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {applying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5" />}
                {applying ? 'Aplicando...' : 'Aplicar a Selección'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
