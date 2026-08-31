'use client';

import { useState } from 'react';
import { Download, Send, ShoppingCart, Loader2, CheckCircle, Minus, Plus, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GatekeeperForm from '@/components/cotizacion/GatekeeperForm';
import AddressForm from '@/components/cotizacion/AddressForm';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/useAuth';
import { formatearPrecio } from '@/lib/pricing/engine';

import { useAuthStore } from '@/stores/auth-store';
import { formatearDescripcionProducto } from '@/lib/pricing/formatters';

// Importar PDF dinámicamente (solo client-side)
const PDFDownloadButton = dynamic(
  () => import('@/components/cotizacion/PDFDownloadButton'),
  { ssr: false, loading: () => <button disabled className="flex-1 bg-brand-400 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Cargando PDF...</button> }
);

export default function CotizacionPage() {
  const items = useCartStore((s) => s.items);
  const actualizarCantidad = useCartStore((s) => s.actualizarCantidad);
  const removerItem = useCartStore((s) => s.removerItem);
  const limpiarCarrito = useCartStore((s) => s.limpiarCarrito);
  const obtenerSubtotal = useCartStore((s) => s.obtenerSubtotal);
  const monedaVenta = useCartStore((s) => s.monedaVenta);

  const { isAuthenticated, lead } = useAuth();
  const [mostrarGatekeeper, setMostrarGatekeeper] = useState(false);
  const [mostrarAddressForm, setMostrarAddressForm] = useState(false);
  const [autoDownloadPDF, setAutoDownloadPDF] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Preparar partidas para API
  const prepararPartidas = () =>
    items.map((item) => ({
      producto_id: item.producto.id,
      sku_interno: item.producto.sku_interno,
      numero_parte: item.producto.numero_parte,
      marca: item.producto.marca,
      descripcion: item.producto.categoria,
      descripcion_tecnica: formatearDescripcionProducto(item.producto),
      cantidad: item.cantidad,
      precio_unitario: item.producto.precio_venta,
      total: item.producto.precio_venta * item.cantidad,
      moneda: item.producto.moneda_venta,
    }));

  const handleSolicitarFormal = async () => {
    // LEER DIRECTAMENTE DEL ESTADO GLOBAL PARA GARANTIZAR DATOS FRESCOS
    const freshLead = useAuthStore.getState().lead;
    if (!freshLead) return;

    setEnviando(true);
    try {
      const partidas = prepararPartidas();
      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: freshLead.id,
          partidas,
          subtotal: obtenerSubtotal(),
          moneda_venta: monedaVenta,
          tipo_cambio_usado: null,
          formula_aplicada: items[0]?.producto.formula_aplicada || null,
          enviar_notificacion: true,
          lead_info: {
            nombre_completo: freshLead.nombre_completo,
            empresa: freshLead.empresa,
            email: freshLead.email,
            telefono: freshLead.telefono,
            direccion: freshLead.direccion, // now has address
            codigo_postal: freshLead.codigo_postal,
          },
        }),
      });

      if (!response.ok) throw new Error('Error al enviar');
      setEnviado(true);
    } catch (error) {
      console.error('Error al solicitar cotización:', error);
      alert('Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Cotización Rápida</h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 mb-6">Agrega productos del catálogo para generar una cotización.</p>
              <Link href="/catalogo" className="inline-block bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Datos del lead si está autenticado */}
              {isAuthenticated && lead && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <p className="text-sm text-brand-800">
                    <span className="font-semibold">Cliente:</span> {lead.nombre_completo} — {lead.empresa} {lead.email && !lead.email.includes('no-email.rem') ? `— ${lead.email}` : ''}
                  </p>
                  {lead.direccion && (
                    <p className="text-sm text-brand-700 mt-1">
                      <span className="font-semibold">Envío a:</span> {lead.direccion}, CP {lead.codigo_postal}
                    </p>
                  )}
                </div>
              )}

              {/* Mensaje de éxito */}
              {enviado && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">¡Solicitud enviada exitosamente!</p>
                    <p className="text-xs text-green-700">Nuestro equipo de ventas te contactará pronto con la cotización formal (incluyendo el envío a tu domicilio), tiempos de entrega y datos bancarios.</p>
                  </div>
                </div>
              )}

              {/* Tabla de partidas */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Producto</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Cantidad</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">P. Unitario</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item.producto.id}>
                          <td className="px-4 py-3">
                            <p className="text-xs text-brand-600 font-semibold">{item.producto.marca}</p>
                            <p className="text-sm font-medium text-gray-900">{item.producto.numero_parte}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{formatearDescripcionProducto(item.producto)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="h-3 w-3" /></button>
                              <span className="text-sm font-medium w-8 text-center">{item.cantidad}</span>
                              <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="h-3 w-3" /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">
                            {formatearPrecio(item.producto.precio_venta, item.producto.moneda_venta)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatearPrecio(item.producto.precio_venta * item.cantidad, item.producto.moneda_venta)}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => removerItem(item.producto.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal */}
                <div className="bg-gray-50 border-t px-4 py-4 flex items-center justify-between">
                  <button onClick={limpiarCarrito} className="text-sm text-red-500 hover:text-red-700">Vaciar carrito</button>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-2xl font-bold text-gray-900">{formatearPrecio(obtenerSubtotal(), monedaVenta)}</p>
                  </div>
                </div>
              </div>

              {/* Leyendas legales */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-xs text-amber-800 font-semibold">⚠️ Importante sobre esta cotización rápida:</p>
                <p className="text-xs text-amber-800">• No incluye costo de flete.</p>
                <p className="text-xs text-amber-800">• No incluye tiempos de entrega ni disponibilidad de stock.</p>
                <p className="text-xs text-amber-800">• Esta información junto con los datos bancarios para su compra le será enviada en la cotización formal.</p>
              </div>

              {/* Acciones */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {!isAuthenticated ? (
                    // Usuario NUEVO: Solo ve 1 botón (Descargar PDF rápido)
                    <button
                      onClick={() => setMostrarGatekeeper(true)}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-5 w-5" />
                      Descargar Cotización PDF
                    </button>
                  ) : (
                    // Usuario AUTENTICADO: Solo ve el botón de cotización formal como principal
                    <div className="flex flex-col gap-3 w-full">
                      <button
                        onClick={() => setMostrarAddressForm(true)}
                        disabled={enviando || enviado}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${
                          enviado 
                            ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
                        }`}
                      >
                        {enviando ? (
                          <><Loader2 className="h-5 w-5 animate-spin" />Procesando...</>
                        ) : enviado ? (
                          <><CheckCircle className="h-5 w-5" />Solicitud Formal Enviada</>
                        ) : (
                          <><Send className="h-5 w-5" />Solicitar Cotización Formal</>
                        )}
                      </button>

                      {/* Link secundario para volver a descargar el PDF rápido sin estorbar */}
                      {!enviado && lead && (
                        <PDFDownloadButton
                          cliente={lead}
                          items={items}
                          subtotal={obtenerSubtotal()}
                          moneda={monedaVenta}
                          autoDownload={autoDownloadPDF}
                          onDownloaded={() => setAutoDownloadPDF(false)}
                          variant="text"
                        />
                      )}
                    </div>
                  )}
                </div>
                {isAuthenticated && !enviado && (
                   <p className="text-xs text-gray-500 text-center mt-2">
                     *Si requieres costos de envío y tiempos de entrega, haz clic en el botón verde.
                   </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {mostrarGatekeeper && (
        <GatekeeperForm 
          onSuccess={() => {
            setMostrarGatekeeper(false);
            setAutoDownloadPDF(true);
          }} 
          onCancel={() => setMostrarGatekeeper(false)} 
        />
      )}
      
      {mostrarAddressForm && (
        <AddressForm 
          onSuccess={() => {
            setMostrarAddressForm(false);
            handleSolicitarFormal();
          }} 
          onCancel={() => setMostrarAddressForm(false)} 
        />
      )}
    </>
  );
}
