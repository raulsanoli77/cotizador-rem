'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { formatearPrecio } from '@/lib/pricing/engine';
import { PackageSearch, ArrowRight, Clock, AlertTriangle, CheckCircle, Package, Loader2 } from 'lucide-react';

export default function ClientPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  const getEstatusInfo = (estatus: string) => {
    switch (estatus) {
      case 'nuevo': return { label: 'Recibido (En espera)', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock };
      case 'en_revision': return { label: 'Requiere tu Aprobación', bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle };
      case 'aprobado_por_cliente': return { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle };
      case 'procesando': return { label: 'Procesando', bg: 'bg-blue-100', text: 'text-blue-800', icon: Package };
      case 'enviado': return { label: 'Enviado', bg: 'bg-purple-100', text: 'text-purple-800', icon: Package };
      case 'cancelado': return { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', icon: null };
      default: return { label: estatus, bg: 'bg-slate-100', text: 'text-slate-700', icon: null };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <PackageSearch className="w-6 h-6 text-brand-600" />
        Historial de Pedidos
      </h1>

      {pedidos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">Aún no tienes pedidos registrados.</p>
          <Link href="/catalogo" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors">
            Ir al Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const statusInfo = getEstatusInfo(pedido.estatus);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={pedido.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-800">
                      {pedido.es_po_verbal ? 'Orden Verbal' : `PO: ${pedido.numero_po || 'N/A'}`}
                    </h3>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                      {StatusIcon && <StatusIcon className="w-3 h-3" />}
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    <p>ID: {pedido.id.split('-')[0]}</p>
                    <p>{new Date(pedido.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold text-slate-700">{formatearPrecio(pedido.total, pedido.moneda)} {pedido.moneda}</p>
                  </div>
                </div>

                <Link 
                  href={`/cuenta/pedidos/${pedido.id}`}
                  className="w-full sm:w-auto text-center px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {pedido.estatus === 'en_revision' ? 'Revisar Sugerencias' : 'Ver Detalles'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
