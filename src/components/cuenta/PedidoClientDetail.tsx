'use client';

import { ArrowLeft, Package, Calendar, MessageSquare, MapPin, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';

export default function PedidoClientDetail({ pedido, partidas }: { pedido: any, partidas: any[] }) {
  const folioLimpio = (pedido.numero_po || pedido.id.slice(0, 8)).replace(/^COT-/i, '');
  const esAtendida = pedido.estatus === 'atendida' || pedido.estatus === 'aprobado_por_cliente' || pedido.estatus === 'enviado';
  const whatsAppMessage = encodeURIComponent(
    `Hola REM Industrial, me gustaría dar seguimiento a mi solicitud de cotización folio ${folioLimpio}.`
  );

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-md border-2 border-slate-300">
        <div className="flex items-center gap-4">
          <Link href="/cuenta/pedidos" className="p-2.5 bg-white rounded-xl border-2 border-slate-300 text-slate-700 hover:text-brand-600 hover:border-slate-400 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Solicitud de Cotización: #{folioLimpio}
              </h1>
              {esAtendida ? (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-300 flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3.5 h-3.5" /> Atendida
                </span>
              ) : (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-sm">
                  <Clock className="w-3.5 h-3.5" /> Pendiente
                </span>
              )}
              {pedido.cotizacion_bind && (
                <span className="px-3 py-1 bg-indigo-50 border-2 border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg shadow-sm">
                  🏢 Cotización Formal Bind ERP: #{pedido.cotizacion_bind}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 font-medium mt-1">
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
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-md">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-600" />
          Destino de Entrega para Cálculo de Flete
        </h3>
        <p className="text-sm font-bold text-slate-900">
          {pedido.calle ? `${pedido.calle} ${pedido.num_exterior || ''}, ` : ''}
          {pedido.colonia ? `Col. ${pedido.colonia}, ` : ''}
          {pedido.ciudad}, {pedido.estado}. CP {pedido.codigo_postal}
        </p>
        
        {pedido.flete_urgente && (
          <span className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-900 border-2 border-amber-300 text-xs font-bold rounded-lg shadow-sm">
            ⚡ Flete Urgente / Prioritario Solicitado
          </span>
        )}

        {pedido.notas_cliente && (
          <p className="text-xs text-slate-700 italic mt-3 border-t-2 border-slate-200 pt-2 font-medium">
            Notas del cliente: &quot;{pedido.notas_cliente}&quot;
          </p>
        )}
      </div>

      {/* Lista de Partidas */}
      <div className="space-y-6">
        {partidas.map((partida, idx) => {
          return (
            <div key={partida.id} className="bg-white rounded-2xl shadow-md border-2 border-slate-300 hover:border-slate-400 p-6 overflow-hidden transition-all">
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-100">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Artículo #{idx + 1}
                </span>
                <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                  {partida.marca}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-slate-100 p-3 rounded-xl border-2 border-slate-200 shrink-0">
                    <Package className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-slate-900 text-xl leading-tight">{partida.numero_parte}</h3>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{partida.descripcion}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
                  <p className="font-black text-2xl text-slate-900">
                    {formatearPrecio(partida.importe, pedido.moneda)}
                  </p>
                  <p className="text-sm font-semibold text-slate-600 mt-0.5">
                    {partida.cantidad} pzs x {formatearPrecio(partida.precio_unitario, pedido.moneda)}
                  </p>
                </div>
              </div>

              {/* Tiempos de entrega y notas de REM si existen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-slate-200">
                <div className="bg-blue-50/70 border-2 border-blue-200 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Tiempo de Entrega Estimado
                  </h4>
                  <p className="text-sm font-bold text-slate-900">
                    {partida.tiempo_entrega ? partida.tiempo_entrega : 'Por confirmar con tu asesor'}
                  </p>
                </div>

                {partida.comentario_admin && (
                  <div className="bg-slate-100/80 border-2 border-slate-200 rounded-xl p-3.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notas de REM
                    </h4>
                    <p className="text-sm font-medium text-slate-800 italic">
                      &quot;{partida.comentario_admin}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen Total y Cierre */}
      <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">¿Deseas formalizar tu compra?</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Comunícate con nuestro equipo comercial para confirmar existencias, emitir factura y acordar la entrega.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-right pr-4 border-r-2 border-slate-200 hidden sm:block">
            <span className="text-xs text-slate-600 font-bold block">Total Cotizado</span>
            <span className="text-2xl font-black text-slate-900">{formatearPrecio(pedido.total, pedido.moneda)} {pedido.moneda}</span>
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
