-- Crear tabla para gestionar los márgenes personalizados por marca
CREATE TABLE IF NOT EXISTS public.marcas_margenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    marca TEXT UNIQUE NOT NULL,
    margen_usa NUMERIC NOT NULL DEFAULT 1.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.marcas_margenes ENABLE ROW LEVEL SECURITY;

-- Lectura pública para poder calcular precios
CREATE POLICY "Lectura publica de margenes" 
ON public.marcas_margenes 
FOR SELECT 
USING (true);

-- Escritura solo para administradores (asumiendo que el acceso general está restringido o se usa en backend)
CREATE POLICY "Escritura de margenes" 
ON public.marcas_margenes 
FOR ALL 
USING (true); -- Ajusta esta política según cómo administres tu autenticación de admins
