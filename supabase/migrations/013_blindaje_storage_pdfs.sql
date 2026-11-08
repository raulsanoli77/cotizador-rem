-- =========================================================================
-- MIGRACIÓN 013: BLINDAJE DE STORAGE (PDFs de Bind ERP privados + bucket media solo admin)
-- =========================================================================
-- Segura de ejecutar múltiples veces (idempotente).
-- No rompe ninguna imagen existente del catálogo, logos, categorías ni vendedores.

CREATE OR REPLACE FUNCTION public.es_admin_autenticado()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles_clientes
    WHERE id = auth.uid()
      AND rol = 'admin'
  );
$$;

-- 1. Bucket privado `cotizaciones-bind` para PDFs oficiales de Bind ERP (máx. 15 MB, solo PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cotizaciones-bind', 'cotizaciones-bind', false, 15728640, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 15728640,
      allowed_mime_types = ARRAY['application/pdf'];

-- 2. Bucket `media`: lectura pública para imágenes del sitio (excepto carpeta cotizaciones_bind),
--    y escritura/actualización/borrado EXCLUSIVAMENTE para administradores.
DROP POLICY IF EXISTS "Lectura Publica Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Media" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Media" ON storage.objects;
DROP POLICY IF EXISTS "Media listar solo admin" ON storage.objects;
DROP POLICY IF EXISTS "Media subir solo admin" ON storage.objects;
DROP POLICY IF EXISTS "Media actualizar solo admin" ON storage.objects;
DROP POLICY IF EXISTS "Media borrar solo admin" ON storage.objects;

CREATE POLICY "Lectura Publica Media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND (
      name NOT LIKE 'cotizaciones_bind/%'
      OR public.es_admin_autenticado()
    )
  );

CREATE POLICY "Media subir solo admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND public.es_admin_autenticado());

CREATE POLICY "Media actualizar solo admin"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND public.es_admin_autenticado())
  WITH CHECK (bucket_id = 'media' AND public.es_admin_autenticado());

CREATE POLICY "Media borrar solo admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND public.es_admin_autenticado());
