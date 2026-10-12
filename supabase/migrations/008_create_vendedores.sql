-- =========================================================================
-- MIGRACIÓN 008: TABLA DE VENDEDORES Y ASIGNACIÓN A CLIENTES
-- =========================================================================

-- 1. Crear tabla de vendedores
CREATE TABLE IF NOT EXISTS public.vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text NOT NULL,        -- Teléfono / WhatsApp (ej. 6141234567)
  email text NOT NULL,           -- Correo del vendedor (ej. vendedor@remindustrial.mx)
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS) para proteger la tabla
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- 3. Permitir lectura de vendedores (para que la tienda y clientes vean la información de contacto)
CREATE POLICY "Vendedores visibles para lectura"
  ON public.vendedores FOR SELECT
  USING (true);

-- 4. Asociar vendedor a clientes
ALTER TABLE public.perfiles_clientes
  ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.vendedores(id) ON DELETE SET NULL;

COMMENT ON TABLE public.vendedores IS 'Equipo de asesores y vendedores comerciales de REM Industrial';
COMMENT ON COLUMN public.perfiles_clientes.vendedor_id IS 'Vendedor asignado a este cliente para atención personalizada';
