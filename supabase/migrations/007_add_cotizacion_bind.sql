-- =========================================================================
-- MÓDULO: ASOCIAR NÚMERO DE COTIZACIÓN FORMAL DE BIND ERP A PEDIDOS
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================================

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cotizacion_bind text;

COMMENT ON COLUMN public.pedidos.cotizacion_bind IS 'Número de cotización formal generado en el ERP Bind';
