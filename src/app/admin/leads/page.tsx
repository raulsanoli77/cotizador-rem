'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Lead } from '@/types';
import { Loader2, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data) setLeads(data as Lead[]);
      setLoading(false);
    }
    fetchLeads();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Leads Capturados (Gatekeeper)</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase">
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Contacto</th>
                  <th className="px-6 py-3 font-medium">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {leads.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Aún no hay leads registrados.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lead.nombre_completo}</div>
                        <div className="text-gray-500">{lead.empresa}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center text-gray-600"><Mail className="h-3.5 w-3.5 mr-2" /> <a href={`mailto:${lead.email}`} className="hover:text-brand-600 hover:underline">{lead.email}</a></div>
                        <div className="flex items-center text-gray-600"><Phone className="h-3.5 w-3.5 mr-2" /> {lead.telefono}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(lead.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
