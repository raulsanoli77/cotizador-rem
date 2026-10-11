'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { eliminarPedido } from '@/app/admin/pedidos/[id]/actions';
import { useRouter } from 'next/navigation';

export default function BotonEliminarPedido({ pedidoId, folio }: { pedidoId: string; folio: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEliminar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ok = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la cotización #${folio}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await eliminarPedido(pedidoId);
      if (!res.success) {
        alert('Error al eliminar: ' + res.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEliminar}
      disabled={loading}
      title={`Eliminar cotización #${folio}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg text-sm font-semibold border border-red-200 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4 text-red-600" />}
      Eliminar
    </button>
  );
}
