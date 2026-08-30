'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  bucket?: string;
  folder?: string;
  onUploadSuccess: (url: string) => void;
  currentUrl?: string | null;
}

export default function ImageUploader({ bucket = 'media', folder = 'logos', onUploadSuccess, currentUrl }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrlData.publicUrl);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
      <div className="text-center">
        {currentUrl ? (
          <div className="relative inline-block">
            <img src={currentUrl} alt="Preview" className="mx-auto h-32 object-contain bg-gray-50 rounded-md border p-2" />
          </div>
        ) : (
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
        )}
        
        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
          <label
            htmlFor={`file-upload-${folder}`}
            className="relative cursor-pointer rounded-md bg-white font-semibold text-brand-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 hover:text-brand-500"
          >
            <span>{uploading ? 'Subiendo...' : (currentUrl ? 'Cambiar imagen' : 'Subir un archivo')}</span>
            <input 
              id={`file-upload-${folder}`} 
              name={`file-upload-${folder}`}
              type="file" 
              className="sr-only" 
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs leading-5 text-gray-600 mt-1">PNG, JPG, GIF hasta 2MB</p>
        
        {uploading && <Loader2 className="mx-auto h-5 w-5 text-brand-500 animate-spin mt-2" />}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
