'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Producto } from '@/types';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

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
    const { error } = await supabase.from('productos').update({ activo: !actual }).eq('id', id);
    if (!error) {
      setProductos(productos.map(p => p.id === id ? { ...p, activo: !actual } : p));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
        <Link href="/admin/carga-masiva" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Importar Excel
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase">
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Marca</th>
                  <th className="px-6 py-3 font-medium">No. Parte</th>
                  <th className="px-6 py-3 font-medium">Categoría</th>
                  <th className="px-6 py-3 font-medium text-right">Costo Base</th>
                  <th className="px-6 py-3 font-medium text-center">Estado</th>
                  <th className="px-6 py-3 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {productos.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hay productos. Importa un Excel para comenzar.</td></tr>
                ) : (
                  productos.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{prod.sku_interno}</td>
                      <td className="px-6 py-3">{prod.marca}</td>
                      <td className="px-6 py-3">{prod.numero_parte}</td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{prod.categoria}</span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium">${prod.costo_base.toFixed(2)} {prod.moneda_costo}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => toggleActivo(prod.id, prod.activo)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${prod.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {prod.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-3 flex justify-center gap-3">
                        <button className="text-blue-600 hover:text-blue-900" title="Editar (Próximamente)"><Edit className="h-4 w-4" /></button>
                        <button className="text-red-600 hover:text-red-900" title="Eliminar (Próximamente)"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
