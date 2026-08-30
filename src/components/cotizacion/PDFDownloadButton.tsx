'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import { QuotePDFDocument, generarFolio, formatearMoneda } from '@/lib/pdf/quote-template';
import type { Lead } from '@/types/lead';
import type { ItemCarrito } from '@/types/quote';

interface PDFDownloadButtonProps {
  cliente: Lead;
  items: ItemCarrito[];
  subtotal: number;
  moneda: 'USD' | 'MXN';
}

export default function PDFDownloadButton({
  cliente,
  items,
  subtotal,
  moneda,
}: PDFDownloadButtonProps) {
  const [generando, setGenerando] = useState(false);

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
