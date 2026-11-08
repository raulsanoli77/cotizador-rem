'use client';

import { useState, useEffect, useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { QuotePDFDocument, generarFolio } from '@/lib/pdf/quote-template';
import { supabase } from '@/lib/supabase/client';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';
import type { Lead } from '@/types/lead';
import type { ItemCarrito } from '@/types/quote';

interface PDFDownloadButtonProps {
  cliente: Lead;
  items: ItemCarrito[];
  subtotal: number;
  moneda: 'USD' | 'MXN';
  autoDownload?: boolean;
  onDownloaded?: () => void;
  variant?: 'primary' | 'text';
}

export default function PDFDownloadButton({
  cliente,
  items,
  subtotal,
  moneda,
  autoDownload,
  onDownloaded,
  variant = 'primary',
}: PDFDownloadButtonProps) {
  const [generando, setGenerando] = useState(false);
  const hasAutoDownloaded = useRef(false);

  const handleDownload = async () => {
    setGenerando(true);
    try {
      const folio = generarFolio();
      const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const partidas = items.map((item) => ({
        cantidad: item.cantidad,
        marca: item.producto.marca,
        numero_parte: item.producto.numero_parte,
        descripcion: formatearDescripcionProducto(item.producto),
        precio_unitario: item.producto.precio_venta,
        total: item.producto.precio_venta * item.cantidad,
        requiere_confirmacion:
          (item.producto.especificaciones_tecnicas as any)?.requiere_confirmacion === true ||
          (item.producto.especificaciones_tecnicas as any)?.requiere_confirmacion === 'true' ||
          item.producto.requiere_confirmacion === true,
      }));

      // Obtener configuración general
      const { data: configData } = await supabase.from('configuracion').select('*');
      
      let empresa = { nombre: 'REM Industrial', rfc: '', direccion: '', email: '', telefono: '' };
      let logoUrl: string | undefined = undefined;
      let textLegal: string | undefined = undefined;
      
      if (configData) {
        configData.forEach((item: any) => {
          if (item.clave === 'empresa' && item.valor) empresa = { ...empresa, ...item.valor };
          if (item.clave === 'apariencia' && item.valor?.logo_url) logoUrl = item.valor.logo_url;
          if (item.clave === 'pdf_config' && item.valor?.text_legal) textLegal = item.valor.text_legal;
        });
      }

      // Asesor Comercial por defecto (Raúl Sánchez - ventas3@remindustrial.com / 614 181 5170)
      let vendedor = {
        nombre: 'Raúl Sánchez',
        email: 'ventas3@remindustrial.com',
        telefono: '614 181 5170',
      };

      // Si es un cliente registrado con sesión activa, verificar si tiene otro asesor asignado
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          const { data: perfil } = await supabase
            .from('perfiles_clientes')
            .select('vendedor:vendedores(nombre, email, telefono, activo)')
            .eq('id', sessionData.session.user.id)
            .maybeSingle();

          if (perfil?.vendedor && (perfil.vendedor as any).activo !== false) {
            vendedor = {
              nombre: (perfil.vendedor as any).nombre || vendedor.nombre,
              email: (perfil.vendedor as any).email || vendedor.email,
              telefono: (perfil.vendedor as any).telefono || vendedor.telefono,
            };
          }
        }
      } catch (err) {
        console.warn('No se pudo consultar asesor asignado:', err);
      }

      // Generar PDF blob en el cliente
      const blob = await pdf(
        <QuotePDFDocument
          folio={folio}
          fecha={fecha}
          cliente={{
            nombre_completo: cliente.nombre_completo,
            empresa: cliente.empresa,
            email: cliente.email,
            telefono: cliente.telefono,
          }}
          partidas={partidas}
          subtotal={subtotal}
          moneda={moneda}
          config={{ empresa, logoUrl, textLegal }}
          vendedor={vendedor}
        />
      ).toBlob();

      // Descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cotizacion_REM_${folio}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      setGenerando(false);
      onDownloaded?.();
    }
  };

  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      handleDownload();
    }
  }, [autoDownload]); // eslint-disable-line react-hooks/exhaustive-deps

  if (variant === 'text') {
    return (
      <button
        onClick={handleDownload}
        disabled={generando}
        className="text-sm font-medium text-brand-600 hover:text-brand-800 underline transition-colors flex items-center justify-center gap-1.5 py-2 mx-auto disabled:opacity-50"
      >
        {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {generando ? 'Generando PDF...' : 'Volver a descargar cotización rápida'}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generando}
      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
    >
      {generando ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <Download className="h-5 w-5" />
          Descargar Cotización PDF
        </>
      )}
    </button>
  );
}
