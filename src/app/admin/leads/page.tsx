'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Lead } from '@/types/lead';
import { Loader2, Mail, Phone, Search, Download, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as xlsx from 'xlsx';

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data as Lead[]);
    setLoading(false);
  }

  // Filtrado de leads
  const leadsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return leads;
    const q = busqueda.toLowerCase();
    return leads.filter(
      (lead) =>
        lead.nombre_completo.toLowerCase().includes(q) ||
        lead.empresa.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.telefono.toLowerCase().includes(q) ||
        (lead.codigo_postal && lead.codigo_postal.toLowerCase().includes(q))
    );
  }, [leads, busqueda]);

  // Borrar lead
  const handleBorrar = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este prospecto? Esta acción no se puede deshacer.')) return;
    
    setEliminandoId(id);
    try {
      const response = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al borrar');
      
      // Quitar de la lista local
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      alert('Error al borrar el lead. Intenta de nuevo.');
      console.error(error);
    } finally {
      setEliminandoId(null);
    }
  };

  // Exportar a Excel
  const handleExportar = () => {
    if (leadsFiltrados.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const dataAExportar = leadsFiltrados.map(lead => ({
      'Fecha de Registro': format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
      'Nombre Completo': lead.nombre_completo,
      'Empresa': lead.empresa,
      'Correo Electrónico': lead.email.includes('no-email.rem') ? 'N/A' : lead.email,
      'Teléfono': lead.telefono,
      'Código Postal': lead.codigo_postal || 'N/A',
      'Dirección de Envío': lead.direccion || 'N/A'
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataAExportar);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Prospectos (Leads)');

    // Auto-ajustar ancho de columnas (aproximado)
    const columnWidths = [
      { wch: 20 }, // Fecha
      { wch: 30 }, // Nombre
      { wch: 25 }, // Empresa
      { wch: 30 }, // Correo
      { wch: 15 }, // Telefono
      { wch: 15 }, // CP
      { wch: 40 }, // Dirección
    ];
    worksheet['!cols'] = columnWidths;

    xlsx.writeFile(workbook, `Leads_REM_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads Capturados</h1>
        
        {/* Controles: Búsqueda y Exportar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar prospecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleExportar}
            disabled={leadsFiltrados.length === 0}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar a Excel
          </button>
        </div>
      </div>

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
                  <th className="px-6 py-3 font-medium">Dirección</th>
                  <th className="px-6 py-3 font-medium">Fecha Registro</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {leadsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {busqueda ? 'No se encontraron prospectos con esa búsqueda.' : 'Aún no hay prospectos registrados.'}
                    </td>
                  </tr>
                ) : (
                  leadsFiltrados.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lead.nombre_completo}</div>
                        <div className="text-gray-500">{lead.empresa}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {!lead.email.includes('no-email.rem') && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-3.5 w-3.5 mr-2 shrink-0" />
                            <a href={`mailto:${lead.email}`} className="hover:text-brand-600 hover:underline break-all">{lead.email}</a>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3.5 w-3.5 mr-2 shrink-0" />
                          {lead.telefono}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.direccion ? (
                          <div className="flex items-start text-gray-600">
                            <MapPin className="h-3.5 w-3.5 mr-2 mt-0.5 shrink-0 text-brand-600" />
                            <div>
                              <span className="block text-xs font-semibold">CP: {lead.codigo_postal}</span>
                              <span className="line-clamp-2 text-xs" title={lead.direccion}>{lead.direccion}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Solo cotización rápida</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(lead.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleBorrar(lead.id)}
                          disabled={eliminandoId === lead.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar prospecto"
                        >
                          {eliminandoId === lead.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
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
