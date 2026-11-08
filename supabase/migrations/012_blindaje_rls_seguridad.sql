-- =========================================================================
-- MIGRACIÓN 012: BLINDAJE DE SEGURIDAD RLS Y PROTECCIÓN CONTRA ESCALACIÓN
-- =========================================================================
-- Segura de ejecutar múltiples veces (idempotente).
-- No afecta ninguna función pública ni administrativa del portal.

-- 1. Función auxiliar segura para verificar si el usuario con sesión en Supabase es Admin
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

-- =========================================================================
-- 2. PROTECCIÓN DE TABLA `configuracion` (Ocultar márgenes y bloquear escritura pública)
-- =========================================================================
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Configuración visible públicamente" ON public.configuracion;
DROP POLICY IF EXISTS "Configuracion publica segura" ON public.configuracion;
DROP POLICY IF EXISTS "Escritura de configuracion solo admin" ON public.configuracion;

-- El público general solo puede leer claves visuales/públicas (logos, apariencia, empresa, pdf).
-- Los márgenes y bitácoras solo son visibles para el servidor (service_role) o un Admin autenticado.
CREATE POLICY "Configuracion publica segura"
  ON public.configuracion
  FOR SELECT
  USING (
    clave NOT IN (
      'marcas_margenes',
      'marcas_margenes_publico',
      'marcas_cruce_volumen',
      'bitacora_actualizaciones_precios'
    )
    OR public.es_admin_autenticado()
  );

-- Solo un administrador autenticado (o el servidor vía service_role) puede modificar configuraciones
CREATE POLICY "Escritura de configuracion solo admin"
  ON public.configuracion
  FOR ALL
  USING (public.es_admin_autenticado())
  WITH CHECK (public.es_admin_autenticado());

-- =========================================================================
-- 3. PROTECCIÓN DE TABLA `marcas_margenes` (Si existe de migraciones previas)
-- =========================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marcas_margenes') THEN
    EXECUTE 'ALTER TABLE public.marcas_margenes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Lectura publica de margenes" ON public.marcas_margenes';
    EXECUTE 'DROP POLICY IF EXISTS "Escritura de margenes" ON public.marcas_margenes';
    EXECUTE 'DROP POLICY IF EXISTS "Margenes solo admin" ON public.marcas_margenes';
    EXECUTE 'CREATE POLICY "Margenes solo admin" ON public.marcas_margenes FOR ALL USING (public.es_admin_autenticado()) WITH CHECK (public.es_admin_autenticado())';
  END IF;
END $$;

-- =========================================================================
-- 4. PROTECCIÓN DE `productos`, `categorias` y `vendedores` (Escritura exclusiva Admin)
-- =========================================================================
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Productos activos visibles públicamente" ON public.productos;
DROP POLICY IF EXISTS "Lectura de productos activos o admin" ON public.productos;
DROP POLICY IF EXISTS "Escritura de productos solo admin" ON public.productos;

CREATE POLICY "Lectura de productos activos o admin"
  ON public.productos
  FOR SELECT
  USING (activo = true OR public.es_admin_autenticado());

CREATE POLICY "Escritura de productos solo admin"
  ON public.productos
  FOR ALL
  USING (public.es_admin_autenticado())
  WITH CHECK (public.es_admin_autenticado());

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Escritura de categorias solo admin" ON public.categorias;
CREATE POLICY "Escritura de categorias solo admin"
  ON public.categorias
  FOR ALL
  USING (public.es_admin_autenticado())
  WITH CHECK (public.es_admin_autenticado());

ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Escritura de vendedores solo admin" ON public.vendedores;
CREATE POLICY "Escritura de vendedores solo admin"
  ON public.vendedores
  FOR ALL
  USING (public.es_admin_autenticado())
  WITH CHECK (public.es_admin_autenticado());

-- =========================================================================
-- 5. PROTECCIÓN DE `leads` (Lectura y borrado exclusivo Admin)
-- =========================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads visibles para admin" ON public.leads;
DROP POLICY IF EXISTS "Leads gestionables por admin" ON public.leads;

CREATE POLICY "Leads visibles para admin"
  ON public.leads
  FOR SELECT
  USING (public.es_admin_autenticado());

CREATE POLICY "Leads gestionables por admin"
  ON public.leads
  FOR DELETE
  USING (public.es_admin_autenticado());

-- =========================================================================
-- 6. CANDADO CONTRA AUTO-APROBACIÓN O ESCALACIÓN A ADMIN EN `perfiles_clientes`
-- =========================================================================
-- Impide que un usuario normal modifique desde el navegador su propio `rol` a 'admin'
-- o su propio `estatus` a 'aprobado'. Solo el servidor (service_role) o un Admin pueden hacerlo.
CREATE OR REPLACE FUNCTION public.proteger_campos_privilegiados_perfil()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  -- Permitir todo si la operación viene del servidor (service_role / postgres) o de un Admin autenticado
  IF v_jwt_role = 'service_role' OR current_user IN ('postgres', 'service_role') OR public.es_admin_autenticado() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- En registro público, forzar siempre rol cliente y estatus pendiente
    NEW.rol := 'cliente';
    NEW.estatus := 'pendiente';
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Impedir que un cliente cambie su propio rol, estatus o términos comerciales
    NEW.rol := OLD.rol;
    NEW.estatus := OLD.estatus;
    NEW.terminos_pago := OLD.terminos_pago;
    NEW.vendedor_id := OLD.vendedor_id;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_campos_privilegiados_perfil ON public.perfiles_clientes;
CREATE TRIGGER trg_proteger_campos_privilegiados_perfil
  BEFORE INSERT OR UPDATE ON public.perfiles_clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_campos_privilegiados_perfil();

-- =========================================================================
-- 7. PRIVACIDAD DE DATOS DE CLIENTES, PEDIDOS Y COTIZACIONES (ANTI-ROBO DE DATOS)
-- =========================================================================
-- Asegura que ningún visitante ni otro cliente pueda descargar la lista de clientes,
-- sus teléfonos, correos, RFCs ni sus pedidos/cotizaciones.

-- A) Tabla `perfiles_clientes`: cada cliente solo ve su propio perfil; el Admin ve todos
ALTER TABLE public.perfiles_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica de perfiles" ON public.perfiles_clientes;
DROP POLICY IF EXISTS "Perfiles visibles para todos" ON public.perfiles_clientes;
DROP POLICY IF EXISTS "Cliente ve su propio perfil o admin ve todos" ON public.perfiles_clientes;
DROP POLICY IF EXISTS "Cliente actualiza su propio perfil o admin" ON public.perfiles_clientes;
DROP POLICY IF EXISTS "Registro de nuevo perfil cliente" ON public.perfiles_clientes;

CREATE POLICY "Cliente ve su propio perfil o admin ve todos"
  ON public.perfiles_clientes
  FOR SELECT
  USING (id = auth.uid() OR public.es_admin_autenticado());

CREATE POLICY "Cliente actualiza su propio perfil o admin"
  ON public.perfiles_clientes
  FOR UPDATE
  USING (id = auth.uid() OR public.es_admin_autenticado())
  WITH CHECK (id = auth.uid() OR public.es_admin_autenticado());

CREATE POLICY "Registro de nuevo perfil cliente"
  ON public.perfiles_clientes
  FOR INSERT
  WITH CHECK (id = auth.uid() OR public.es_admin_autenticado());

-- B) Tabla `pedidos`: cada cliente solo ve sus propios pedidos; el Admin ve todos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cliente ve sus propios pedidos o admin" ON public.pedidos;
CREATE POLICY "Cliente ve sus propios pedidos o admin"
  ON public.pedidos
  FOR SELECT
  USING (cliente_id = auth.uid() OR public.es_admin_autenticado());

-- C) Tabla `partidas_pedido`: cada cliente solo ve las partidas de sus propios pedidos; el Admin ve todas
ALTER TABLE public.partidas_pedido ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cliente ve sus propias partidas o admin" ON public.partidas_pedido;
CREATE POLICY "Cliente ve sus propias partidas o admin"
  ON public.partidas_pedido
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pedidos p
      WHERE p.id = partidas_pedido.pedido_id
        AND p.cliente_id = auth.uid()
    )
    OR public.es_admin_autenticado()
  );

-- D) Tabla `cotizaciones`: solo el Admin (o el servidor) puede leer el historial de cotizaciones
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cotizaciones visibles solo para admin" ON public.cotizaciones;
CREATE POLICY "Cotizaciones visibles solo para admin"
  ON public.cotizaciones
  FOR SELECT
  USING (public.es_admin_autenticado());

