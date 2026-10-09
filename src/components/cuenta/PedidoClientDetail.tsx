'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Package, Calendar, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';
import { supabase } from '@/lib/supabase/client';
import { aprobarPedidoAdmin } from '@/app/cuenta/pedidos/[id]/actions';

export default function PedidoClientDetail({ pedido, partidas }: { pedido: any, partidas: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  
  // Estado local para guardar las decisiones de las alternativas
  const [decisiones, setDecisiones] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    partidas.forEach(p => {
      if (p.alternativa_producto_id && !p.decision_cliente) {
        initialState[p.id] = 'alternativa'; // Default
      } else if (p.decision_cliente) {
        initialState[p.id] = p.decision_cliente;
      }
    });
    return initialState;
  });

  // Estado para la cantidad deseada de la alternativa
  const [cantidades, setCantidades] = useState<Record<string, number>>(() => {
    const initialState: Record<string, number> = {};
    partidas.forEach(p => {
      if (p.alternativa_producto_id) {
        initialState[p.id] = p.alternativa_cantidad || p.cantidad;
      }
    });
    return initialState;
  });

  const isEnRevision = pedido.estatus === 'en_revision';

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from('ordenes_compra').getPublicUrl(path);
    return data.publicUrl;
  };

  const manejarDecision = (partidaId: string, decision: string) => {
    setDecisiones(prev => ({ ...prev, [partidaId]: decision }));
  };

  const manejarCantidad = (partidaId: string, cantidad: number) => {
    setCantidades(prev => ({ ...prev, [partidaId]: cantidad }));
  };

  const aprobarPedido = async () => {
    setLoading(true);
    setErrorStr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Debes iniciar sesión para aprobar.');

      const result = await aprobarPedidoAdmin(
        pedido.id,
        session.user.id,
        decisiones,
        cantidades
      );

      if (!result.success) throw new Error(result.error);
      
      window.location.reload();
    } catch (e: any) {
      setErrorStr(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/cuenta/pedidos" className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Detalle de Pedido
          </h1>
          <p className="text-sm text-slate-500">
            PO: {pedido.es_po_verbal ? 'Verbal' : pedido.numero_po} • {new Date(pedido.fecha_creacion).toLocaleDateString()}
          </p>
        </div>
        {pedido.po_url && (
          <div className="ml-auto">
             <a href={getPdfUrl(pedido.po_url)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-600 hover:underline">
               Ver mi PDF original
             </a>
          </div>
        )}
      </div>

      {isEnRevision && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="shrink-0 bg-orange-100 p-2 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 text-lg">Tu pedido requiere revisión</h3>
              <p className="text-orange-800 text-sm mt-1">
                Hemos asignado tiempos de entrega a tus artículos. En caso de no contar con existencia de algún producto, te hemos sugerido una alternativa. Por favor, revisa cada artículo, <strong>selecciona tu preferencia en las alternativas</strong>, y aprueba tu orden para que podamos procesarla.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {partidas.map((partida) => {
          const tieneAlternativa = !!partida.alternativa_producto_id;
          const decisionActual = decisiones[partida.id] || partida.decision_cliente;
          
          return (
            <div key={partida.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{partida.numero_parte}</h3>
                    <p className="text-sm text-slate-500">{partida.marca}</p>
                    <p className="text-xs text-slate-400 mt-1">{partida.descripcion}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className={`font-bold text-xl ${decisionActual === 'cancelar' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {formatearPrecio(partida.importe, pedido.moneda)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {partida.cantidad} pzs x {formatearPrecio(partida.precio_unitario, pedido.moneda)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Tiempo Estimado de Entrega
                  </h4>
                  <p className="text-sm font-medium text-slate-700">
                    {partida.tiempo_entrega ? partida.tiempo_entrega : 'Pendiente de confirmación'}
                  </p>
                </div>

                {partida.comentario_admin && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notas de REM
                    </h4>
                    <p className="text-sm text-slate-700 italic">
                      "{partida.comentario_admin}"
                    </p>
                  </div>
                )}
              </div>

              {tieneAlternativa && (
                <div className="mt-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-orange-200 text-orange-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    ARTÍCULO SUSTITUTO
                  </div>
                  <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {partida.alternativa_motivo || 'No hay stock del original. Te sugerimos esta alternativa:'}
                  </h4>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-orange-100 gap-4">
                    <div>
                      <p className="font-bold text-slate-800 text-base">{partida.alternativa_numero_parte} <span className="text-xs font-normal text-slate-500 ml-1">({partida.alternativa_marca})</span></p>
                      <p className="text-xs text-slate-500 mt-1">{partida.alternativa_descripcion}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 bg-orange-50 px-4 py-2 rounded-lg">
                      <p className="text-xs font-bold text-orange-500 uppercase">Precio Unitario</p>
                      <p className="font-bold text-orange-700 text-lg">{formatearPrecio(partida.alternativa_precio, pedido.moneda)}</p>
                    </div>
                  </div>
                  
                    {isEnRevision && (
                      <div className="mt-4 pt-4 border-t border-orange-200/60">
                        <p className="text-sm font-semibold text-orange-900 mb-3">Por favor, selecciona qué deseas hacer con esta partida:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          <label className={`flex items-start gap-2 cursor-pointer p-3 rounded-lg border ${decisionActual === 'alternativa' ? 'bg-orange-100 border-orange-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                              type="radio" 
                              name={`decision-${partida.id}`} 
                              className="mt-0.5" 
                              checked={decisionActual === 'alternativa'}
                              onChange={() => manejarDecision(partida.id, 'alternativa')}
                            />
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">Sustituir por alternativa</span>
                              <span className="text-xs text-slate-500">Se surtirá el sustituto mostrado arriba.</span>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2 cursor-pointer p-3 rounded-lg border ${decisionActual === 'ambos' ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                              type="radio" 
                              name={`decision-${partida.id}`} 
                              className="mt-0.5"
                              checked={decisionActual === 'ambos'}
                              onChange={() => manejarDecision(partida.id, 'ambos')}
                            />
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">Pedir Ambos</span>
                              <span className="text-xs text-slate-500">Conservar el original en espera y también pedir la alternativa.</span>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2 cursor-pointer p-3 rounded-lg border ${decisionActual === 'original' ? 'bg-slate-100 border-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                              type="radio" 
                              name={`decision-${partida.id}`} 
                              className="mt-0.5"
                              checked={decisionActual === 'original'}
                              onChange={() => manejarDecision(partida.id, 'original')}
                            />
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">Solo original</span>
                              <span className="text-xs text-slate-500">Acepto el tiempo de entrega y no quiero la alternativa.</span>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2 cursor-pointer p-3 rounded-lg border ${decisionActual === 'cancelar' ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                            <input 
                              type="radio" 
                              name={`decision-${partida.id}`} 
                              className="mt-0.5"
                              checked={decisionActual === 'cancelar'}
                              onChange={() => manejarDecision(partida.id, 'cancelar')}
                            />
                            <div>
                              <span className="text-sm font-bold text-red-700 block">Cancelar partida</span>
                              <span className="text-xs text-red-500">Quitar el artículo de la orden.</span>
                            </div>
                          </label>

                        </div>

                        {(decisionActual === 'alternativa' || decisionActual === 'ambos') && (
                          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">Cantidad a pedir de la alternativa</span>
                              <span className="text-xs text-slate-500">¿Cuántas piezas de la alternativa requieres?</span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              className="w-24 px-3 py-1.5 border border-slate-300 rounded text-center font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                              value={cantidades[partida.id] || ''}
                              onChange={(e) => manejarCantidad(partida.id, parseInt(e.target.value) || 1)}
                            />
                          </div>
                        )}
                      </div>
                    )}

                  {!isEnRevision && decisionActual && (
                    <div className="mt-4 pt-4 border-t border-orange-200/60 flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-900">Decisión tomada:</span>
                      <span className="text-sm font-semibold bg-white px-3 py-1 rounded-full text-slate-700 border border-slate-200">
                        {decisionActual === 'alternativa' ? 'Aceptó Alternativa' : decisionActual === 'original' ? 'Conservar Original' : 'Canceló Partida'}
                      </span>
                    </div>
                  )}

                </div>
              )}
              
            </div>
          );
        })}
      </div>

      {isEnRevision && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">¿Estás de acuerdo con estas condiciones?</h3>
            <p className="text-sm text-slate-500">Revisa los tiempos de entrega y alternativas antes de aprobar.</p>
          </div>
          <button
            onClick={aprobarPedido}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            {loading ? 'Procesando...' : 'Aprobar Tiempos y Alternativas'}
          </button>
        </div>
      )}
      
      {errorStr && <p className="text-red-500 font-bold text-center mt-4">{errorStr}</p>}

    </div>
  );
}
