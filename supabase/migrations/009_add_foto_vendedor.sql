-- =========================================================================
-- MIGRACIÓN 009: AGREGAR FOTO A TABLA DE VENDEDORES
-- =========================================================================

ALTER TABLE public.vendedores 
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMENT ON COLUMN public.vendedores.foto_url IS 'URL pública de la fotografía o avatar del vendedor';
