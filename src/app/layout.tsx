import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REM Industrial | Catálogo y Cotizador de Herramientas Industriales',
  description: 'Catálogo en línea de herramientas de maquinado industrial. Cotiza rápidamente cortadores, insertos, brocas, portaherramientas y más.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased text-slate-900 bg-gray-50">{children}</body>
    </html>
  );
}
