'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NuevoProducto() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  // Estado base del producto
  const [formData, setFormData] = useState({
    sku_interno: '',
    numero_parte: '',
    marca: '',
    proveedor_origen: '',
    costo_base: '',
    moneda_costo: 'USD',
    categoria_id: '',
    categoria: '',
    sistema_medicion: 'Métrico',
  });

  // Estado dinámico para especificaciones
  const [especificaciones, setEspecificaciones] = useState<Record<string, string>>({});
  
  // Categoría seleccionada para renderizar campos
  const selectedCat = categorias.find(c => c.id === formData.categoria_id);

  useEffect(() => {
    async function loadCategorias() {
      const { data } = await supabase.from('categorias').select('*');
      if (data) {
        setCategorias(data);
      }
      setLoading(false);
    }
    loadCategorias();
  }, []);

  const handleCatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    const cat = categorias.find(c => c.id === catId);
    setFormData({ ...formData, categoria_id: catId, categoria: cat?.nombre || '' });
    
    // Limpiar especificaciones anteriores al cambiar de categoría
    setEspecificaciones({});
  };

  const handleSpecChange = (key: string, value: string) => {
    setEspecificaciones(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
      const specsToSave = { ...especificaciones, _sistema_medida: formData.sistema_medicion };

      const { error } = await supabase.from('productos').insert({
        sku_interno: formData.sku_interno,
        numero_parte: formData.numero_parte,
        marca: formData.marca,
        proveedor_origen: formData.proveedor_origen,
        costo_base: parseFloat(formData.costo_base),
        moneda_costo: formData.moneda_costo,
        categoria_id: formData.categoria_id,
        categoria: formData.categoria,
        especificaciones_tecnicas: specsToSave,
        activo: true
      });

      setSaving(false);
      
      if (error) {
        alert('Error al crear producto: ' + error.message);
      } else {
        router.push('/admin/productos');
      }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

    const renderUnidad = (campoUnidad: string) => {
      if (campoUnidad === 'mm' && formData.sistema_medicion === 'Estándar') return '(in / pulgadas)';
      if (campoUnidad) return `(${campoUnidad})`;
      return '';
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/productos" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Agregar Nuevo Producto</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
          
          {/* Datos Básicos */}
          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Información General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Interno *</label>
                <input required type="text" value={formData.sku_interno} onChange={e => setFormData({...formData, sku_interno: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Parte *</label>
                <input required type="text" value={formData.numero_parte} onChange={e => setFormData({...formData, numero_parte: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input required type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor / Origen</label>
                <input type="text" value={formData.proveedor_origen} onChange={e => setFormData({...formData, proveedor_origen: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Costo y Precio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Base *</label>
                <input required type="number" step="0.01" min="0" value={formData.costo_base} onChange={e => setFormData({...formData, costo_base: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda de Costo *</label>
                <select value={formData.moneda_costo} onChange={e => setFormData({...formData, moneda_costo: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categoría y Specs Dinámicas */}
          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Clasificación Técnica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría del Producto *</label>
                <select required value={formData.categoria_id} onChange={handleCatChange} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
                  <option value="">-- Selecciona una categoría --</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sistema de Medición *</label>
                <select required value={formData.sistema_medicion} onChange={e => setFormData({...formData, sistema_medicion: e.target.value})} className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm">
                  <option value="Métrico">Métrico (Milímetros)</option>
                  <option value="Estándar">Estándar (Pulgadas / Fraccional)</option>
                </select>
              </div>
            </div>

            {selectedCat && selectedCat.campos_filtro && selectedCat.campos_filtro.length > 0 && (
              <div className="bg-brand-50 border border-brand-100 p-5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedCat.campos_filtro.map((campo: any) => (
                  <div key={campo.nombre}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {campo.nombre.replace(/_/g, ' ')} <span className="text-gray-500">{renderUnidad(campo.unidad)}</span>
                    </label>
                  
                  {campo.tipo === 'seleccion' && campo.opciones ? (
                    <select 
                      value={especificaciones[campo.nombre] || ''}
                      onChange={(e) => handleSpecChange(campo.nombre, e.target.value)}
                      className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="">-- Seleccionar --</option>
                      {campo.opciones.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={especificaciones[campo.nombre] || ''}
                      onChange={(e) => handleSpecChange(campo.nombre, e.target.value)}
                      className="w-full border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-brand-700 disabled:bg-brand-400"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  );
}
