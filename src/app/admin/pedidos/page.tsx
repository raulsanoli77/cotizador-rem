import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ShoppingCart, Eye, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { formatearPrecio } from '@/lib/pricing/engine';

// Para forzar SSR y siempre ver los últimos pedidos
export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const supabase = createAdminClient();

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      perfil:perfiles_clientes(
        empresa,
        nombre_completo,
        email,
        telefono
      )
    `)
    .order('fecha_creacion', { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">Error al cargar cotizaciones: {error.message}</div>
      </div>
    );
  }

  const getStatusBadge = (estatus: string) => {
    switch (estatus) {
      case 'nuevo':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Nueva Solicitud</span>;
      case 'en_revision':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> En Atención</span>;
      case 'aprobado_por_cliente':
      case 'aprobado':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Confirmada</span>;
      case 'procesando':
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">En Surtido</span>;
      case 'enviado':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Enviado</span>;
      case 'cancelado':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelada</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{estatus}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand-600" />
            Cotizaciones Formales
          </h1>
          <p className="text-slate-500 mt-1">Historial de solicitudes de cotización formal enviadas por clientes registrados</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Folio / Bind ERP</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Destino (Flete)</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Estatus</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidos?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay cotizaciones registradas.
                  </td>
                </tr>
              ) : (
                pedidos?.map((pedido) => {
                  const folioLimpio = (pedido.numero_po || pedido.id.slice(0, 8)).replace(/^COT-/i, '');
                  const clienteNombre = pedido.perfil?.nombre_completo || 'Cliente';
                  const msgWhatsApp = `Hola ${clienteNombre}, te contacto de REM Industrial sobre tu solicitud de cotización folio ${folioLimpio}`;

                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">Solicitud: #{folioLimpio}</div>
                        {pedido.cotizacion_bind ? (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] rounded font-bold">
                            🏢 Bind: #{pedido.cotizacion_bind}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">Sin asociar a Bind</div>
                        )}
                        {pedido.flete_urgente && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] rounded font-bold">
                              ⚡ FLETE URGENTE
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{pedido.perfil?.empresa || 'Cliente'}</div>
                        <div className="text-slate-500 text-xs">{pedido.perfil?.nombre_completo}</div>
                        {pedido.perfil?.telefono && (
                          <a 
                            href={`https://wa.me/52${pedido.perfil.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msgWhatsApp)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-bold text-xs block mt-0.5"
                          >
                            💬 {pedido.perfil.telefono}
                          </a>
                        )}
                      </td>
                    <td className="px-6 py-4 text-slate-700 text-xs">
                      <span className="font-semibold block">{pedido.ciudad}, {pedido.estado}</span>
                      <span className="text-slate-500">CP {pedido.codigo_postal}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(pedido.fecha_creacion).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatearPrecio(pedido.total, pedido.moneda)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(pedido.estatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/pedidos/${pedido.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Ver / Editar
                      </Link>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
