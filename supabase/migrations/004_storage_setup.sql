-- ============================================
-- Migración 004: Supabase Storage para Imágenes
-- ============================================

-- 1. Crear el bucket público 'media'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS en storage.objects si no está habilitado
-- (Por defecto Supabase lo habilita, pero lo aseguramos)

-- 3. Políticas de Acceso para el bucket 'media'

-- Permitir lectura pública (Cualquiera puede ver las imágenes)
CREATE POLICY "Lectura Publica Media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- Permitir a usuarios autenticados (Admin) insertar
CREATE POLICY "Admin Insert Media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Permitir a usuarios autenticados (Admin) actualizar
CREATE POLICY "Admin Update Media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Permitir a usuarios autenticados (Admin) eliminar
CREATE POLICY "Admin Delete Media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
