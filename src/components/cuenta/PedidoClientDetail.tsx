'use client';

import { ArrowLeft, Package, Calendar, AlertCircle, MessageSquare, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';

export default function PedidoClientDetail({ pedido, partidas }: { pedido: any, partidas: any[] }) {
  const whatsAppMessage = encodeURIComponent(
    `Hola REM Industrial, me gustaría dar seguimiento a mi cotización ${pedido.numero_po || `#${pedido.id.slice(0, 8)}`}.`
  );

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Link href="/cuenta/pedidos" className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Cotización: {pedido.numero_po || `#${pedido.id.slice(0, 8)}`}
            </h1>
            <p className="text-sm text-slate-500">
              Fecha de solicitud: {new Date(pedido.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <a 
          href={`https://wa.me/52614815170?text=${whatsAppMessage}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contactar Asesor por WhatsApp
        </a>
      </div>

      {/* Tarjeta de Destino de Entrega */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-600" />
          Destino de Entrega para Cálculo de Flete
        </h3>
        <p className="text-sm font-semibold text-slate-800">
          {pedido.calle ? `${pedido.calle} ${pedido.num_exterior || ''}, ` : ''}
          {pedido.colonia ? `Col. ${pedido.colonia}, ` : ''}
          {pedido.ciudad}, {pedido.estado}. CP {pedido.codigo_postal}
        </p>
        
        {pedido.flete_urgente && (
          <span className="inline-block mt-2 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-md">
            ⚡ Flete Urgente / Prioritario Solicitado
          </span>
        )}

        {pedido.notas_cliente && (
          <p className="text-xs text-slate-600 italic mt-2 border-t border-slate-200/60 pt-2">
            Notas del cliente: "{pedido.notas_cliente}"
          </p>
        )}
      </div>

      {/* Lista de Partidas */}
      <div className="space-y-4">
        {partidas.map((partida) => {
          const tieneAlternativa = !!partida.alternativa_producto_id;
          
          return (
            <div key={partida.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{partida.numero_parte}</h3>
                    <p className="text-sm font-semibold text-brand-600">{partida.marca}</p>
                    <p className="text-xs text-slate-500 mt-1">{partida.descripcion}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-bold text-xl text-slate-900">
                    {formatearPrecio(partida.importe, pedido.moneda)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {partida.cantidad} pzs x {formatearPrecio(partida.precio_unitario, pedido.moneda)}
                  </p>
                </div>
              </div>

              {/* Tiempos de entrega y notas de REM si existen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Tiempo de Entrega Estimado
                  </h4>
                  <p className="text-sm font-medium text-slate-700">
                    {partida.tiempo_entrega ? partida.tiempo_entrega : 'Por confirmar con tu asesor'}
                  </p>
                </div>

                {partida.comentario_admin && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notas de REM
                    </h4>
                    <p className="text-sm text-slate-700 italic">
                      "{partida.comentario_admin}"
                    </p>
                  </div>
                )}
              </div>

              {/* Alternativa sugerida informativa */}
              {tieneAlternativa && (
                <div className="mt-4 bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Alternativa Sugerida por REM:</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-lg border border-amber-100 gap-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{partida.alternativa_numero_parte} <span className="text-xs text-slate-500 font-normal">({partida.alternativa_marca})</span></p>
                      <p className="text-xs text-slate-500">{partida.alternativa_descripcion}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 bg-amber-50 px-3 py-1.5 rounded-lg">
                      <p className="font-bold text-amber-800 text-sm">{formatearPrecio(partida.alternativa_precio, pedido.moneda)} c/u</p>
                    </div>
                  </div>
                  {partida.alternativa_motivo && (
                    <p className="text-xs text-amber-900 mt-2 italic">Motivo: {partida.alternativa_motivo}</p>
                  )}
                </div>
              )}
              
            </div>
          );
        })}
      </div>

      {/* Resumen Total y Cierre */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">¿Deseas formalizar tu compra?</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Comunícate con nuestro equipo comercial para confirmar existencias, emitir factura y acordar la entrega.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-right pr-4 border-r border-slate-200 hidden sm:block">
            <span className="text-xs text-slate-500 block">Total Cotizado</span>
            <span className="text-xl font-bold text-slate-900">{formatearPrecio(pedido.total, pedido.moneda)} {pedido.moneda}</span>
          </div>
          
          <a
            href={`https://wa.me/52614815170?text=${whatsAppMessage}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Contactar a Ventas
          </a>
        </div>
      </div>

    </div>
  );
}
