/**
 * Utilidades compartidas (cliente y servidor) para validar referencias a PDFs de Bind ERP.
 */

export const BUCKET_PDF_BIND = 'cotizaciones-bind';
export const PDF_BIND_MAX_BYTES = 15 * 1024 * 1024; // 15 MB

// Ruta interna en bucket privado: "<pedidoId>/Cotizacion_REM_...pdf"
const RUTA_PRIVADA_REGEX = /^[A-Za-z0-9_-]{8,64}\/[A-Za-z0-9_.-]+\.pdf$/i;

/**
 * Verifica que `po_url` sea una ruta válida del bucket privado `cotizaciones-bind`
 * o una URL legítima del propio proyecto en Supabase Storage (retrocompatibilidad),
 * rechazando cualquier URL externa o inyección.
 */
export function esReferenciaPdfBindSegura(poUrl: unknown): poUrl is string {
  if (typeof poUrl !== 'string') return false;
  const val = poUrl.trim();
  if (!val) return false;

  if (RUTA_PRIVADA_REGEX.test(val)) {
    return true;
  }

  // Retrocompatibilidad con archivos subidos previamente al bucket del propio proyecto
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (
    supabaseUrl &&
    val.startsWith(`${supabaseUrl}/storage/v1/object/`) &&
    val.toLowerCase().endsWith('.pdf')
  ) {
    return true;
  }

  return false;
}
