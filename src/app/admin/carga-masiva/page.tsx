'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { parsearExcelProductos, type ParseResult } from '@/lib/excel/parser';

export default function AdminCargaMasiva() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setSuccess(null);
    const buffer = await selectedFile.arrayBuffer();
    const result = parsearExcelProductos(buffer);
    setParseResult(result);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!parseResult || parseResult.productos.length === 0) return;
    
    setUploading(true);
    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos: parseResult.productos }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Error al subir a la BD');
      
      setSuccess(data.message);
      setFile(null);
      setParseResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Carga Masiva de Productos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Uploader Box */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={onFileSelect} />
            <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Arrastra tu archivo Excel aquí</h3>
            <p className="text-sm text-gray-500 mb-4">Solo formatos .xlsx o .xls</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Seleccionar Archivo
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-3" />
              {success}
            </div>
          )}

          {/* Preview & Errors */}
          {parseResult && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b p-4 flex justify-between items-center bg-gray-50">
                <div className="flex items-center">
                  <FileType className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">{file?.name}</span>
                </div>
                <span className="text-sm text-gray-500">{parseResult.productos.length} productos detectados</span>
              </div>
              
              <div className="p-6">
                {parseResult.errores.length > 0 ? (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center text-red-800 font-medium mb-2">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Se encontraron {parseResult.errores.length} errores:
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {parseResult.errores.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                      {parseResult.errores.length > 10 && <li>...y {parseResult.errores.length - 10} más.</li>}
                    </ul>
                    <p className="text-sm mt-3 text-red-600 font-medium">Por favor corrige el Excel y vuelve a subirlo.</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm font-medium mb-6">
                      ✓ El archivo está listo para ser importado. No se encontraron errores de validación básica.
                    </div>
                    
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-400"
                    >
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                      {uploading ? 'Importando a la Base de Datos...' : 'Confirmar e Importar Productos'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Help Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 self-start">
          <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Instrucciones</h3>
          <p className="text-sm text-gray-600 mb-4">
            El archivo Excel debe contener los siguientes encabezados obligatorios (primera fila):
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6 list-disc list-inside bg-gray-50 p-3 rounded-lg">
            <li><span className="font-medium text-gray-900">SKU_Interno</span> (Único)</li>
            <li><span className="font-medium text-gray-900">Numero_Parte</span></li>
            <li><span className="font-medium text-gray-900">Marca</span></li>
            <li><span className="font-medium text-gray-900">Categoria</span></li>
            <li><span className="font-medium text-gray-900">Costo_Base</span> (Numérico)</li>
          </ul>
          <p className="text-sm text-gray-600 mb-2 font-medium">Columnas Opcionales Fijas:</p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
            <li>Proveedor_Origen</li>
            <li>Moneda_Costo (USD o MXN)</li>
            <li>Imagen_URL</li>
          </ul>
          <p className="text-sm text-gray-600">
            <strong>Nota:</strong> Cualquier otra columna agregada (ej. Diámetro, Flautas, Recubrimiento) se guardará automáticamente como <span className="text-blue-600">Especificación Técnica Dinámica</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
