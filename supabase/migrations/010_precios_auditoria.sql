-- ============================================
-- Migración 010: Auditoría y actualización de precios
-- --------------------------------------------
-- 1. costo_actualizado_at: fecha del último cambio/confirmación de COSTO
--    (independiente de updated_at, que cambia con cualquier edición).
-- 2. requiere_confirmacion: bandera propia para la nota
--    "Precio y entrega sujetos a confirmación" (ya no dentro de
--    especificaciones_tecnicas).
-- 3. Trigger que refresca costo_actualizado_at cuando cambia el costo
--    o la moneda por cualquier vía (Carga Masiva, edición, etc.).
-- 4. Función actualizar_precios_lote: actualización atómica (todo o nada).
--
-- Es seguro ejecutarla más de una vez.
-- ============================================

-- 1. Columnas nuevas
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS costo_actualizado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requiere_confirmacion BOOLEAN NOT NULL DEFAULT FALSE;

-- Punto de partida: la fecha de modificación actual.
-- (Debe ir ANTES de cualquier otro UPDATE, porque el trigger de updated_at la cambia.)
UPDATE productos
SET costo_actualizado_at = updated_at
WHERE costo_actualizado_at IS NULL;

ALTER TABLE productos ALTER COLUMN costo_actualizado_at SET DEFAULT NOW();
ALTER TABLE productos ALTER COLUMN costo_actualizado_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_productos_costo_actualizado_at
  ON productos(costo_actualizado_at);

-- 2. Limpieza: mover la bandera que pudo haberse guardado dentro de
--    especificaciones_tecnicas (versión anterior del módulo) a su columna.
UPDATE productos
SET requiere_confirmacion = COALESCE(
      LOWER(especificaciones_tecnicas->>'requiere_confirmacion') IN ('true', '1'),
      FALSE
    ),
    especificaciones_tecnicas = especificaciones_tecnicas - 'requiere_confirmacion'
WHERE especificaciones_tecnicas ? 'requiere_confirmacion';

-- 3. Trigger: si cambia el costo o la moneda, refrescar la fecha del costo
CREATE OR REPLACE FUNCTION marcar_costo_actualizado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.costo_base IS DISTINCT FROM OLD.costo_base
     OR NEW.moneda_costo IS DISTINCT FROM OLD.moneda_costo THEN
    NEW.costo_actualizado_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_productos_costo_actualizado ON productos;
CREATE TRIGGER trigger_productos_costo_actualizado
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION marcar_costo_actualizado();

-- 4. Actualización atómica por lote.
--    p_items: [{ "id": "uuid", "costo": 4.85, "moneda": "USD" }, ...]
--    Marca TODOS los productos recibidos como confirmados hoy (aunque el
--    precio no haya cambiado) y les quita la nota de confirmación.
CREATE OR REPLACE FUNCTION actualizar_precios_lote(p_items JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE productos p
  SET costo_base = i.costo,
      moneda_costo = i.moneda,
      costo_actualizado_at = NOW(),
      requiere_confirmacion = FALSE
  FROM jsonb_to_recordset(p_items) AS i(id UUID, costo NUMERIC, moneda TEXT)
  WHERE p.id = i.id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Solo el servidor (service role) puede ejecutarla
REVOKE ALL ON FUNCTION actualizar_precios_lote(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION actualizar_precios_lote(JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION actualizar_precios_lote(JSONB) TO service_role;
