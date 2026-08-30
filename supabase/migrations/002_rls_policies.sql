-- ============================================
-- RLS Policies - Row Level Security
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Categorías: lectura pública
CREATE POLICY "Categorías visibles públicamente"
  ON categorias FOR SELECT
  USING (true);

-- Productos: lectura pública solo activos
CREATE POLICY "Productos activos visibles públicamente"
  ON productos FOR SELECT
  USING (activo = true);

-- Leads: solo insertar (el gatekeeper puede crear leads)
CREATE POLICY "Cualquiera puede registrarse como lead"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Leads: lectura solo con service role (admin)
-- No se necesita política para SELECT ya que solo admin lee leads

-- Cotizaciones: insertar públicamente
CREATE POLICY "Cualquiera puede crear cotización"
  ON cotizaciones FOR INSERT
  WITH CHECK (true);

-- Configuración: lectura pública (tipo de cambio, etc)
CREATE POLICY "Configuración visible públicamente"
  ON configuracion FOR SELECT
  USING (true);
