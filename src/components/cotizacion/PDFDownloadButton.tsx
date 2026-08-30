'use client';

import { useState, useEffect, useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { QuotePDFDocument, generarFolio } from '@/lib/pdf/quote-template';
import { supabase } from '@/lib/supabase/client';
import type { Lead } from '@/types/lead';
import type { ItemCarrito } from '@/types/quote';

interface PDFDownloadButtonProps {
  cliente: Lead;
  items: ItemCarrito[];
  subtotal: number;
  moneda: 'USD' | 'MXN';
  autoDownload?: boolean;
  onDownloaded?: () => void;
}

export default function PDFDownloadButton({
  cliente,
  items,
  subtotal,
  moneda,
  autoDownload,
  onDownloaded,
}: PDFDownloadButtonProps) {
  const [generando, setGenerando] = useState(false);
  const hasAutoDownloaded = useRef(false);

  useEffect(() => {
    if (autoDownload && !hasAutoDownloaded.current) {
      hasAutoDownloaded.current = true;
      handleDownload();
    }
  }, [autoDownload]);

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
        descripcion:
          Object.entries(item.producto.especificaciones_tecnicas)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ') || item.producto.categoria,
        precio_unitario: item.producto.precio_venta,
        total: item.producto.precio_venta * item.cantidad,
      }));

      // Obtener configuración
      const { data: configData } = await supabase.from('configuracion').select('*');
      
      let empresa = { nombre: 'REM Industrial', rfc: '', direccion: '', email: '', telefono: '' };
      let logoUrl: string | undefined = undefined;
      let textLegal = 'Esta cotización rápida no incluye costo de flete, tiempos de entrega ni disponibilidad. Estos datos le serán enviados junto con la cotización formal y datos bancarios para su compra.';
      
      if (configData) {
        configData.forEach((item: any) => {
          if (item.clave === 'empresa' && item.valor) empresa = { ...empresa, ...item.valor };
          if (item.clave === 'apariencia' && item.valor?.logo_url) logoUrl = item.valor.logo_url;
          if (item.clave === 'pdf_config' && item.valor?.text_legal) textLegal = item.valor.text_legal;
        });
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
