-- ============================================
-- Catálogo y Cotizador REM Industrial
-- Migración 001: Creación de tablas principales
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabla: categorias
-- Almacena las categorías de productos con sus
-- campos de filtro dinámicos
-- ============================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  campos_filtro JSONB NOT NULL DEFAULT '[]'::jsonb,
  descripcion TEXT,
  icono_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: productos
-- Catálogo principal con especificaciones
-- técnicas dinámicas en JSONB
-- ============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_interno TEXT NOT NULL UNIQUE,
  numero_parte TEXT NOT NULL,
  marca TEXT NOT NULL,
  proveedor_origen TEXT NOT NULL,
  costo_base DECIMAL(12, 4) NOT NULL CHECK (costo_base >= 0),
  moneda_costo TEXT NOT NULL CHECK (moneda_costo IN ('USD', 'MXN')),
  categoria TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  especificaciones_tecnicas JSONB NOT NULL DEFAULT '{}'::jsonb,
  imagen_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX idx_productos_marca ON productos(marca);
CREATE INDEX idx_productos_numero_parte ON productos(numero_parte);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_sku ON productos(sku_interno);

-- Índice GIN para búsquedas dentro de JSONB
CREATE INDEX idx_productos_specs ON productos USING GIN (especificaciones_tecnicas);

-- Índice de texto completo para búsqueda
CREATE INDEX idx_productos_busqueda ON productos USING GIN (
  to_tsvector('spanish', coalesce(numero_parte, '') || ' ' || coalesce(marca, '') || ' ' || coalesce(categoria, ''))
);

-- ============================================
-- Tabla: leads
-- Contactos capturados por el Gatekeeper
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  token_sesion TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_empresa ON leads(empresa);

-- ============================================
-- Tabla: cotizaciones
-- Cotizaciones rápidas generadas
-- ============================================
CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  folio TEXT NOT NULL UNIQUE,
  partidas JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(14, 2) NOT NULL DEFAULT 0,
  moneda_venta TEXT NOT NULL CHECK (moneda_venta IN ('USD', 'MXN')),
  tipo_cambio_usado DECIMAL(10, 4),
  formula_aplicada TEXT,
  estatus TEXT NOT NULL DEFAULT 'borrador' CHECK (estatus IN ('borrador', 'solicitada', 'en_proceso', 'completada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cotizaciones_lead ON cotizaciones(lead_id);
CREATE INDEX idx_cotizaciones_folio ON cotizaciones(folio);
CREATE INDEX idx_cotizaciones_estatus ON cotizaciones(estatus);

-- ============================================
-- Tabla: configuracion
-- Parámetros globales del sistema
-- ============================================
CREATE TABLE configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('tipo_cambio_manual', '{"valor": 20.0, "activo": false}'::jsonb, 'Tipo de cambio manual override'),
  ('margenes', '{"importacion": 1.15, "utilidad_usa": 1.5, "margen_mx": 0.7, "iva": 0.16}'::jsonb, 'Factores de margen para fórmulas de precio'),
  ('empresa', '{"nombre": "REM Industrial", "rfc": "", "direccion": "", "telefono": "", "email": "ventas@remindustrial.com"}'::jsonb, 'Datos fiscales y comerciales');

-- ============================================
-- Función: actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_productos_updated_at
  BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_cotizaciones_updated_at
  BEFORE UPDATE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_categorias_updated_at
  BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
