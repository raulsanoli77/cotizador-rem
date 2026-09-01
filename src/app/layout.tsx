import type { Metadata } from 'next';
import './globals.css';
import { createServerClient } from '@/lib/supabase/server';

// Forzar que siempre lea datos frescos de la BD
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServerClient();
  const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
  const titulo = data?.valor?.titulo || 'REM Industrial';
  return {
    title: `${titulo} | Catálogo y Cotizador de Herramientas Industriales`,
    description: 'Catálogo en línea de herramientas de maquinado industrial. Cotiza rápidamente cortadores, insertos, brocas, portaherramientas y más.',
  };
}

// Default blue color scale to fallback to
const defaultColors = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb', // primary default
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
};

// Genera una paleta basada en un color (simplificado, en un caso real se usa color-mix o una librería)
function generatePalette(hex: string) {
  if (!hex) return defaultColors;
  // Usamos color-mix nativo de CSS para la paleta dinámica basada en el primario
  return {
    50: `color-mix(in srgb, ${hex} 10%, white)`,
    100: `color-mix(in srgb, ${hex} 20%, white)`,
    200: `color-mix(in srgb, ${hex} 40%, white)`,
    300: `color-mix(in srgb, ${hex} 60%, white)`,
    400: `color-mix(in srgb, ${hex} 80%, white)`,
    500: hex,
    600: `color-mix(in srgb, ${hex} 85%, black)`,
    700: `color-mix(in srgb, ${hex} 70%, black)`,
    800: `color-mix(in srgb, ${hex} 55%, black)`,
    900: `color-mix(in srgb, ${hex} 40%, black)`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
  const colorPrimario = data?.valor?.color_primario;
  const colors = colorPrimario ? generatePalette(colorPrimario) : defaultColors;

  return (
    <html lang="es">
      <body className="font-sans antialiased text-slate-900 bg-slate-50 selection:bg-brand-200 selection:text-brand-900">
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --brand-50: ${colors[50]};
            --brand-100: ${colors[100]};
            --brand-200: ${colors[200]};
            --brand-300: ${colors[300]};
            --brand-400: ${colors[400]};
            --brand-500: ${colors[500]};
            --brand-600: ${colors[600]};
            --brand-700: ${colors[700]};
            --brand-800: ${colors[800]};
            --brand-900: ${colors[900]};
          }
        `}} />
        {children}
      </body>
    </html>
  );
}
