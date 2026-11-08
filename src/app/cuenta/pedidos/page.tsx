'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, syncAuthCookie } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';
import { PackageSearch, ArrowRight, Clock, CheckCircle, Loader2, FileText, RotateCcw } from 'lucide-react';
import { obtenerPartidasParaRepetirPedido } from '@/app/cuenta/pedidos/[id]/actions';
import { useCartStore } from '@/stores/cart-store';

export default function ClientPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repitiendoId, setRepitiendoId] = useState<string | null>(null);

  const agregarItem = useCartStore((s) => s.agregarItem);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }
      syncAuthCookie(session.access_token);

      const { data, error: err } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', session.user.id)
        .order('fecha_creacion', { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setPedidos(data || []);
      }
      setLoading(false);
    };

    fetchPedidos();
  }, []);

  const handleRepetirPedido = async (pedidoId: string) => {
    setRepitiendoId(pedidoId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        syncAuthCookie(session.access_token);
      }
      const res = await obtenerPartidasParaRepetirPedido(pedidoId, session?.access_token || null);
      if (!res.success) {
        alert(res.error || 'No se pudo recargar el pedido.');
        return;
      }
      if (res.items.length === 0) {
        alert('Los artículos de esta cotización ya no se encuentran activos en el catálogo.');
        return;
      }

      for (const item of res.items) {
        agregarItem(item.producto, item.cantidad);
      }

      if (res.noDisponibles.length > 0) {
        alert(
          `Se agregaron ${res.items.length} artículos a tu cotización con precios actualizados.\nNota: Los siguientes códigos ya no están disponibles: ${res.noDisponibles.join(', ')}`
        );
      }

      router.push('/checkout');
    } catch (err) {
      console.error('Error al repetir pedido:', err);
      alert('Ocurrió un error al volver a cotizar este pedido.');
    } finally {
      setRepitiendoId(null);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  const getEstatusInfo = (estatus: string) => {
    const esAtendida = estatus === 'atendida' || estatus === 'aprobado_por_cliente' || estatus === 'enviado';
    if (esAtendida) {
      return { label: 'Atendida', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
    }
    return { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock };
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-300 p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <PackageSearch className="w-6 h-6 text-brand-600" />
        Historial de Cotizaciones
      </h1>

      {pedidos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 font-medium mb-4">Aún no tienes cotizaciones registradas.</p>
          <Link href="/catalogo" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-md shadow-brand-600/20">
            Ir al Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const statusInfo = getEstatusInfo(pedido.estatus);
            const StatusIcon = statusInfo.icon;
            const folioLimpio = (pedido.numero_po || pedido.id.slice(0, 8)).replace(/^COT-/i, '');
            const estaRepitiendo = repitiendoId === pedido.id;
            
            return (
              <div key={pedido.id} className="bg-white border-2 border-slate-300 rounded-2xl p-5 hover:shadow-lg hover:border-slate-400 transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-sm">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h3 className="font-bold text-lg text-slate-900">
                      Solicitud: #{folioLimpio}
                    </h3>
                    {pedido.cotizacion_bind && (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800">
                        🏢 Bind ERP: #{pedido.cotizacion_bind}
                      </span>
                    )}
                    {pedido.po_url && (
                      <a
                        href={pedido.po_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-1 transition-colors shadow-sm"
                        title="Descargar PDF Oficial de Cotización"
                      >
                        <FileText className="w-3 h-3" />
                        PDF Oficial
                      </a>
                    )}
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 border ${statusInfo.bg} ${statusInfo.text}`}>
                      {StatusIcon && <StatusIcon className="w-3 h-3" />}
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                    <p>{new Date(pedido.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="font-extrabold text-slate-900">{formatearPrecio(pedido.total, pedido.moneda)} {pedido.moneda}</p>
                    {pedido.ciudad && <p className="text-slate-500">📍 {pedido.ciudad}, {pedido.estado} (CP {pedido.codigo_postal})</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleRepetirPedido(pedido.id)}
                    disabled={estaRepitiendo}
                    className="flex-1 sm:flex-initial text-center px-3.5 py-2 bg-brand-50 hover:bg-brand-100 border-2 border-brand-200 hover:border-brand-300 text-brand-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs sm:text-sm shadow-2xs disabled:opacity-50 cursor-pointer"
                    title="Cargar estos mismos artículos en el carrito con precios actualizados"
                  >
                    {estaRepitiendo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Volver a Cotizar
                      </>
                    )}
                  </button>

                  <Link 
                    href={`/cuenta/pedidos/${pedido.id}`}
                    className="flex-1 sm:flex-initial text-center px-4 py-2 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm shadow-sm"
                  >
                    Ver Detalle
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
