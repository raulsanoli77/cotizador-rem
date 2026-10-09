'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Save, CheckCircle, Package, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';

export default function PedidoDetailAdmin({ pedido, partidas, productosOriginales }: { pedido: any, partidas: any[], productosOriginales: any[] }) {
  const router = useRouter();
  const [estatus, setEstatus] = useState(pedido.estatus);
  const [loading, setLoading] = useState(false);
  const [partidasState, setPartidasState] = useState(partidas);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [successStr, setSuccessStr] = useState<string | null>(null);

  const handleEtaChange = (id: string, value: string) => {
    setPartidasState(prev => prev.map(p => p.id === id ? { ...p, tiempo_entrega: value } : p));
  };

  const handleAlternativaChange = (id: string, prop: string, value: string) => {
    setPartidasState(prev => prev.map(p => p.id === id ? { ...p, [prop]: value } : p));
  };

  const guardarCambios = async () => {
    setLoading(true);
    setErrorStr(null);
    setSuccessStr(null);
    
    try {
      // Guardar estatus del pedido
      const { error: errPedido } = await supabase
        .from('pedidos')
        .update({ estatus })
        .eq('id', pedido.id);
      
      if (errPedido) throw new Error(errPedido.message);

      // Guardar partidas
      for (const p of partidasState) {
        const { error: errPartida } = await supabase
          .from('partidas_pedido')
          .update({
            tiempo_entrega: p.tiempo_entrega,
            alternativa_numero_parte: p.alternativa_numero_parte,
            alternativa_marca: p.alternativa_marca,
          })
          .eq('id', p.id);
        
        if (errPartida) throw new Error(errPartida.message);
      }

      setSuccessStr('Cambios guardados correctamente.');
      router.refresh();
    } catch (e: any) {
      setErrorStr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado y Navegación */}
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos" className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-brand-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pedido: {pedido.id.split('-')[0]}
          </h1>
          <p className="text-slate-500">
            {new Date(pedido.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Detalles */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Información del Cliente</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Cliente</p>
                <p className="font-semibold">{pedido.perfil?.empresa || 'Desconocido'}</p>
                <p className="text-slate-600">{pedido.perfil?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Orden de Compra (PO)</p>
                <p className="font-bold">{pedido.es_po_verbal ? 'ORDEN VERBAL' : pedido.numero_po}</p>
                {pedido.po_url && (
                  <a 
                    href={`https://npxxixkypcxykbltijtj.supabase.co/storage/v1/object/public/ordenes_compra/${pedido.po_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline text-xs"
                  >
                    Ver PDF Adjunto
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Envío y Logística</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Calle:</span> {pedido.calle} {pedido.num_exterior} {pedido.num_interior}</p>
              <p><span className="text-slate-500">Colonia:</span> {pedido.colonia}</p>
              <p><span className="text-slate-500">Destino:</span> {pedido.ciudad}, {pedido.estado}. CP {pedido.codigo_postal}</p>
              
              {pedido.flete_urgente && (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-lg font-bold border border-orange-200 flex items-center gap-2">
                  ⚡ FLETE URGENTE SOLICITADO
                </div>
              )}
              {pedido.notas_cliente && (
                <div>
                  <p className="text-slate-500 mt-2">Notas del Cliente:</p>
                  <p className="bg-slate-50 p-2 rounded border border-slate-100 italic">{pedido.notas_cliente}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Administración</h2>
            
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estatus del Pedido</label>
            <select 
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="nuevo">Nuevo</option>
              <option value="en_revision">En Revisión (Regresarlo al cliente)</option>
              <option value="aprobado_por_cliente">Aprobado (Cliente)</option>
              <option value="procesando">Procesando</option>
              <option value="enviado">Enviado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Si marcas "En Revisión", el cliente deberá aprobar los Tiempos de Entrega y alternativas.
            </p>

            <button
              onClick={guardarCambios}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            {errorStr && <p className="text-red-500 text-sm mt-3">{errorStr}</p>}
            {successStr && <p className="text-green-600 text-sm mt-3">{successStr}</p>}
          </div>
        </div>

        {/* Columna Derecha: Partidas */}
        <div className="lg:col-span-2 space-y-4">
          {partidasState.map((partida, idx) => (
            <div key={partida.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{partida.numero_parte}</h3>
                    <p className="text-sm text-slate-500">{partida.marca}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{partida.descripcion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-brand-600">
                    {formatearPrecio(partida.importe, pedido.moneda)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {partida.cantidad} pzs x {formatearPrecio(partida.precio_unitario, pedido.moneda)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                {/* ETA */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-brand-500" /> Tiempo de Entrega (ETA)
                  </label>
                  <input 
                    type="text"
                    value={partida.tiempo_entrega || ''}
                    onChange={(e) => handleEtaChange(partida.id, e.target.value)}
                    placeholder="Ej. 3 a 5 días hábiles"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                  />
                </div>

                {/* Alternativa */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Search className="w-4 h-4 text-orange-500" /> Sugerir Alternativa
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={partida.alternativa_numero_parte || ''}
                      onChange={(e) => handleAlternativaChange(partida.id, 'alternativa_numero_parte', e.target.value)}
                      placeholder="Num Parte Alt."
                      className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    />
                    <input 
                      type="text"
                      value={partida.alternativa_marca || ''}
                      onChange={(e) => handleAlternativaChange(partida.id, 'alternativa_marca', e.target.value)}
                      placeholder="Marca"
                      className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Llenar solo si no hay stock del original.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
