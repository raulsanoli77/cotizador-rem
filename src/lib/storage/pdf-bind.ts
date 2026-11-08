// Módulo exclusivo de servidor (usa la service role key).
import { createAdminClient } from '@/lib/supabase/admin';
import { BUCKET_PDF_BIND, PDF_BIND_MAX_BYTES, esReferenciaPdfBindSegura } from './pdf-bind-shared';

const SEGUNDOS_URL_FIRMADA = 3600; // 1 hora

let bucketVerificado = false;

/**
 * Garantiza que el bucket privado `cotizaciones-bind` exista en Supabase Storage
 * incluso si aún no se ha corrido la migración SQL 013 manualmente.
 */
export async function asegurarBucketPrivadoPdf(): Promise<void> {
  if (bucketVerificado) return;
  const supabase = createAdminClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET_PDF_BIND);
  if (!bucket) {
    await supabase.storage.createBucket(BUCKET_PDF_BIND, {
      public: false,
      fileSizeLimit: PDF_BIND_MAX_BYTES,
      allowedMimeTypes: ['application/pdf'],
    });
  }
  bucketVerificado = true;
}

/**
 * Genera una URL firmada temporal para visualizar/descargar el PDF de Bind ERP.
 * Llamar únicamente tras haber validado que el solicitante es el dueño del pedido o Admin.
 */
export async function generarUrlFirmadaPdfBind(poUrl: unknown): Promise<string | null> {
  if (!esReferenciaPdfBindSegura(poUrl)) return null;

  const val = poUrl.trim();
  // Si es una URL completa de Supabase Storage anterior, extraer ruta o devolver firmada
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const prefixPublicMedia = `${supabaseUrl}/storage/v1/object/public/media/`;
  const supabase = createAdminClient();

  if (supabaseUrl && val.startsWith(prefixPublicMedia)) {
    const legacyPath = decodeURIComponent(val.slice(prefixPublicMedia.length));
    const { data } = await supabase.storage
      .from('media')
      .createSignedUrl(legacyPath, SEGUNDOS_URL_FIRMADA);
    return data?.signedUrl || val;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_PDF_BIND)
    .createSignedUrl(val, SEGUNDOS_URL_FIRMADA);

  if (error || !data?.signedUrl) {
    console.error('[PDF Bind] Error generando URL firmada:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Elimina del Storage el archivo PDF anterior cuando se reemplaza o se quita del pedido.
 */
export async function eliminarArchivoPdfBindAnterior(poUrl: unknown): Promise<void> {
  if (!esReferenciaPdfBindSegura(poUrl)) return;
  const val = poUrl.trim();
  const supabase = createAdminClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const prefixPublicMedia = `${supabaseUrl}/storage/v1/object/public/media/`;

  try {
    if (supabaseUrl && val.startsWith(prefixPublicMedia)) {
      const legacyPath = decodeURIComponent(val.slice(prefixPublicMedia.length));
      await supabase.storage.from('media').remove([legacyPath]);
    } else {
      await supabase.storage.from(BUCKET_PDF_BIND).remove([val]);
    }
  } catch (err) {
    console.warn('[PDF Bind] No se pudo borrar el archivo anterior:', err);
  }
}
