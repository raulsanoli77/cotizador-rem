'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import PedidoClientDetail from '@/components/cuenta/PedidoClientDetail';
import { Loader2 } from 'lucide-react';

export default function CuentaPedidoPage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [partidas, setPartidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
        return;
      }

      const id = params.id as string;

      const { data: pedidoData, error: errPedido } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single();

      if (errPedido || !pedidoData) {
        setError('Pedido no encontrado');
        setLoading(false);
        return;
      }

      if (pedidoData.cliente_id !== session.user.id) {
        setError('No tienes permiso para ver este pedido');
        setLoading(false);
        return;
      }

      const { data: partidasData } = await supabase
        .from('partidas_pedido')
        .select('*')
        .eq('pedido_id', id)
        .order('id', { ascending: true });

      setPedido(pedidoData);
      setPartidas(partidasData || []);
      setLoading(false);
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="p-8 text-red-500 font-bold text-center">{error}</div>;

  return (
    <PedidoClientDetail 
      pedido={pedido} 
      partidas={partidas} 
    />
  );
}
