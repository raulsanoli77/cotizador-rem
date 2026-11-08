-- =========================================================================
-- MIGRACIÓN 011: AGREGAR FOTO A TABLA DE PERFILES DE CLIENTES / ADMINS
-- =========================================================================

ALTER TABLE public.perfiles_clientes 
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMENT ON COLUMN public.perfiles_clientes.foto_url IS 'URL pública de la fotografía o avatar del usuario/administrador';
