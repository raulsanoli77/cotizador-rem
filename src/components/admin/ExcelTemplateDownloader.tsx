'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelTemplateDownloader() {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('');

  useEffect(() => {
    async function loadCategorias() {
      const { data } = await supabase.from('categorias').select('id, nombre, campos_filtro');
      if (data) {
        setCategorias(data);
        if (data.length > 0) setSelectedCat(data[0].id);
      }
      setLoading(false);
    }
    loadCategorias();
  }, []);

  const handleDownload = () => {
    const categoria = categorias.find(c => c.id === selectedCat);
    if (!categoria) return;

    // Columnas base con los nombres que el usuario ya usa en sus Excels
    const baseColumns = [
      'SKU_Interno', 
      'Marca', 
      'Categoria',
      'COSTO', 
      'MONEDA',
      'PAIS DE ORIGEN',
      'NUMERO DE PARTE', 
    ];
    
    // Columnas dinámicas de la categoría
    const dynamicColumns: string[] = [];
    (categoria.campos_filtro || []).forEach((campo: any) => {
      dynamicColumns.push(campo.nombre);
    });
    
    // Cabeceras finales
    const headers = [...baseColumns, ...dynamicColumns];

    // Crear un libro de trabajo con las cabeceras y una fila de ejemplo
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    // Ajustar anchos de columna
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));

    // Descargar el archivo
    XLSX.writeFile(wb, `Plantilla_${categoria.nombre.replace(/\s+/g, '_')}.xlsx`);
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-brand-600" />;
  if (categorias.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <select 
        value={selectedCat} 
        onChange={e => setSelectedCat(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md"
      >
        {categorias.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
      <button
        onClick={handleDownload}
        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
      >
        <Download className="w-4 h-4 mr-2 text-gray-500" />
        Descargar Plantilla
      </button>
    </div>
  );
}
