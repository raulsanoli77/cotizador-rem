'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, Calendar, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';
import { actualizarPedido, eliminarPedido } from '@/app/admin/pedidos/[id]/actions';

export default function PedidoDetailAdmin({ pedido, partidas }: { pedido: any; partidas: any[]; productosOriginales?: any[] }) {
  const router = useRouter();

  const normalizarEstatus = (st?: string) => {
    if (st === 'atendida' || st === 'aprobado_por_cliente' || st === 'enviado') return 'atendida';
    return 'pendiente';
  };

  const [estatus, setEstatus] = useState(normalizarEstatus(pedido.estatus));
  const [cotizacionBind, setCotizacionBind] = useState(pedido.cotizacion_bind || '');
  const [notasCliente, setNotasCliente] = useState(pedido.notas_cliente || '');
  const [loading, setLoading] = useState(false);
  const [partidasState, setPartidasState] = useState(partidas);
  const [partidasEliminadas, setPartidasEliminadas] = useState<string[]>([]);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [successStr, setSuccessStr] = useState<string | null>(null);

  const folioLimpio = (pedido.numero_po || pedido.id.slice(0, 8)).replace(/^COT-/i, '');
  const clienteNombre = pedido.perfil?.nombre_completo || 'Cliente';

  // Cálculos dinámicos de totales
  const subtotalCalculado = partidasState.reduce(
    (acc, p) => acc + (p.importe ?? ((Number(p.cantidad) || 0) * (Number(p.precio_unitario) || 0))),
    0
  );
  const ivaCalculado = subtotalCalculado * 0.16;
  const totalCalculado = subtotalCalculado + ivaCalculado;

  const handlePropChange = (id: string, prop: string, value: any) => {
    setPartidasState(prev => prev.map(p => p.id === id ? { ...p, [prop]: value } : p));
  };

  const handleCantidadChange = (id: string, val: string) => {
    const parsed = parseInt(val, 10);
    const cant = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setPartidasState(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nuevoImporte = cant * (Number(p.precio_unitario) || 0);
      return { ...p, cantidad: cant, importe: nuevoImporte };
    }));
  };

  const handlePrecioChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    const precio = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setPartidasState(prev => prev.map(p => {
      if (p.id !== id) return p;
      const nuevoImporte = (Number(p.cantidad) || 0) * precio;
      return { ...p, precio_unitario: precio, importe: nuevoImporte };
    }));
  };

  const eliminarPartida = (partidaId: string, numeroParte: string) => {
    if (partidasState.length <= 1) {
      alert('La cotización debe tener al menos un producto. Si deseas descartarla por completo, usa la opción "Eliminar Cotización".');
      return;
    }
    const seguro = window.confirm(`¿Deseas eliminar el producto ${numeroParte} de esta cotización?`);
    if (!seguro) return;

    setPartidasEliminadas(prev => [...prev, partidaId]);
    setPartidasState(prev => prev.filter(p => p.id !== partidaId));
  };

  const guardarCambios = async () => {
    setLoading(true);
    setErrorStr(null);
    setSuccessStr(null);

    try {
      const result = await actualizarPedido(
        pedido.id,
        estatus,
        pedido.estatus,
        partidasState,
        cotizacionBind,
        {
          notas_cliente: notasCliente,
          subtotal: subtotalCalculado,
          iva: ivaCalculado,
          total: totalCalculado,
          partidasEliminadas
        }
      );

      if (!result.success) throw new Error(result.error);

      setSuccessStr('Cambios guardados correctamente.');
      router.refresh();
    } catch (e: any) {
      setErrorStr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCotizacion = async () => {
    const ok = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la solicitud #${folioLimpio}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setLoading(true);
    setErrorStr(null);
    try {
      const res = await eliminarPedido(pedido.id);
      if (!res.success) throw new Error(res.error);
      router.push('/admin/pedidos');
    } catch (err: any) {
      setErrorStr(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/pedidos" className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-brand-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Solicitud de Cotización: #{folioLimpio}
            </h1>
            <p className="text-slate-500 text-sm">
              Fecha: {new Date(pedido.fecha_creacion).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={handleEliminarCotizacion}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          Eliminar Cotización
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Información y Administración */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Información del Cliente */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Información del Cliente</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Empresa</p>
                <p className="font-bold text-slate-900 text-base">{pedido.perfil?.empresa || 'Cliente'}</p>
                <p className="text-slate-700 font-medium">{pedido.perfil?.nombre_completo}</p>
                <p className="text-slate-500 text-xs mt-0.5">{pedido.perfil?.email}</p>
              </div>

              {pedido.perfil?.telefono && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-500 text-xs mb-1">Teléfono Directo</p>
                  <a 
                    href={`https://wa.me/52${pedido.perfil.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${clienteNombre}, te contacto de REM Industrial sobre tu solicitud de cotización folio ${folioLimpio}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    💬 WhatsApp: {pedido.perfil.telefono}
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-500 text-xs">Folio Solicitud Web</p>
                <p className="font-bold text-brand-600 text-base">#{folioLimpio}</p>
                {cotizacionBind ? (
                  <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">Cotización Formal Bind ERP</p>
                    <p className="font-extrabold text-indigo-900 text-sm">#{cotizacionBind}</p>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-medium">Cotización Bind ERP: <span className="italic">Pendiente de asociar</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Envío y Logística */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Envío y Logística</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Calle:</span> {pedido.calle} {pedido.num_exterior} {pedido.num_interior}</p>
              <p><span className="text-slate-500">Colonia:</span> {pedido.colonia}</p>
              <p><span className="text-slate-500">Destino:</span> {pedido.ciudad}, {pedido.estado}. CP {pedido.codigo_postal}</p>
              
              {pedido.flete_urgente && (
                <div className="bg-orange-100 text-orange-800 p-2.5 rounded-lg font-bold border border-orange-200 flex items-center gap-2 text-xs">
                  ⚡ FLETE URGENTE SOLICITADO
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-semibold text-xs mb-1">Notas del Cliente (Editable):</label>
                <textarea
                  rows={2}
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  placeholder="Sin notas del cliente..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-brand-500 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Resumen Económico */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-3">Resumen de Cotización</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({pedido.moneda}):</span>
                <span className="font-semibold text-slate-900">{formatearPrecio(subtotalCalculado, pedido.moneda)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (16%):</span>
                <span className="font-semibold text-slate-900">{formatearPrecio(ivaCalculado, pedido.moneda)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Estimado:</span>
                <span className="text-brand-600 text-lg">{formatearPrecio(totalCalculado, pedido.moneda)} {pedido.moneda}</span>
              </div>
            </div>
          </div>

          {/* Administración */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Administración</h2>
            
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estatus de la Cotización</label>
            <select 
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm font-bold text-slate-800"
            >
              <option value="pendiente">⏳ Pendiente</option>
              <option value="atendida">✅ Atendida</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Cambia a &quot;Atendida&quot; una vez que hayas revisado y procesado esta cotización.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                No. Cotización Formal Bind ERP
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Ingresa el folio o número generado en Bind ERP para asociarlo con esta solicitud:
              </p>
              <input 
                type="text"
                value={cotizacionBind}
                onChange={(e) => setCotizacionBind(e.target.value)}
                placeholder="Ej. 12450 ó QT19854"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm font-semibold text-slate-800"
              />
            </div>

            <button
              onClick={guardarCambios}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            {errorStr && <p className="text-red-500 text-sm mt-3 font-medium">{errorStr}</p>}
            {successStr && <p className="text-green-600 text-sm mt-3 font-semibold">{successStr}</p>}

            <button
              onClick={handleEliminarCotizacion}
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-4 rounded-xl border border-red-200 transition-colors text-xs"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              Eliminar esta Cotización
            </button>
          </div>
        </div>

        {/* Columna Derecha: Partidas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-slate-800">
              Artículos Solicitados ({partidasState.length})
            </h2>
            <span className="text-xs text-slate-500">
              Puedes ajustar cantidades, precios unitarios, tiempos de entrega o eliminar artículos.
            </span>
          </div>

          {partidasState.map((partida, idx) => {
            const partidaImporte = partida.importe ?? ((Number(partida.cantidad) || 0) * (Number(partida.precio_unitario) || 0));

            return (
              <div key={partida.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                
                {/* Cabecera del producto */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-slate-100 p-3 rounded-xl shrink-0">
                      <Package className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <h3 className="font-bold text-slate-900 text-lg">{partida.numero_parte}</h3>
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded font-bold border border-brand-200">
                          {partida.marca}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{partida.descripcion}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => eliminarPartida(partida.id, partida.numero_parte)}
                    title="Eliminar este artículo de la cotización"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Campos Editables de Cantidad, Precio y Total */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cantidad:</label>
                    <input 
                      type="number"
                      min={1}
                      value={partida.cantidad}
                      onChange={(e) => handleCantidadChange(partida.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Precio Unitario ({pedido.moneda}):</label>
                    <input 
                      type="number"
                      step="0.01"
                      min={0}
                      value={partida.precio_unitario}
                      onChange={(e) => handlePrecioChange(partida.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm font-bold bg-white"
                    />
                  </div>
                  <div className="flex flex-col justify-center sm:text-right">
                    <span className="text-xs font-bold text-slate-500">Importe Total:</span>
                    <span className="font-black text-lg text-brand-600">
                      {formatearPrecio(partidaImporte, pedido.moneda)}
                    </span>
                  </div>
                </div>

                {/* Tiempos de Entrega (ETA) y Comentarios del Administrador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-600" /> Tiempo de Entrega (ETA)
                    </label>
                    <input 
                      type="text"
                      value={partida.tiempo_entrega || ''}
                      onChange={(e) => handlePropChange(partida.id, 'tiempo_entrega', e.target.value)}
                      placeholder="Ej. 3 a 5 días hábiles"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Comentario para el cliente (Opcional)
                    </label>
                    <textarea 
                      rows={2}
                      value={partida.comentario_admin || ''}
                      onChange={(e) => handlePropChange(partida.id, 'comentario_admin', e.target.value)}
                      placeholder="Nota o especificación sobre este artículo..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-brand-500 text-xs resize-none"
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
