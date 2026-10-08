'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Users, Building, Mail, Phone, Calendar, Edit2, ShieldAlert, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type PerfilCliente = {
  id: string;
  email: string;
  nombre_completo: string;
  empresa: string;
  telefono: string;
  rfc: string;
  estatus: 'pendiente' | 'aprobado' | 'rechazado';
  terminos_pago: string;
  fecha_registro: string;
};

import { actualizarEstatusCliente } from './actions';

export default function ClientesB2BPage() {
  const [clientes, setClientes] = useState<PerfilCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSelect, setClienteSelect] = useState<PerfilCliente | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form states
  const [editEstatus, setEditEstatus] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [editTerminos, setEditTerminos] = useState('Contado');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles_clientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) {
      console.error('Error cargando clientes:', error);
    } else {
      setClientes(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (c: PerfilCliente) => {
    setClienteSelect(c);
    setEditEstatus(c.estatus);
    setEditTerminos(c.terminos_pago || 'Contado');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelect) return;
    
    setGuardando(true);
    try {
      await actualizarEstatusCliente(
        clienteSelect.id,
        clienteSelect.email,
        clienteSelect.nombre_completo,
        editEstatus,
        editTerminos
      );
      setModalOpen(false);
      cargarClientes();
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
    setGuardando(false);
  };

  const filtrados = clientes.filter(c => 
    c.empresa?.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            Clientes B2B
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona aprobaciones, accesos y términos de pago de tus clientes.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Buscar empresa, nombre..."
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-64 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Empresa / Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Términos Comerciales</th>
                <th className="px-6 py-4">Estatus</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                          <Building className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.empresa || 'Sin empresa'}</p>
                          <p className="text-xs text-slate-500">{c.nombre_completo}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">RFC: {c.rfc || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3" /> {c.email}</span>
                        <span className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3" /> {c.telefono || 'Sin teléfono'}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1"><Calendar className="h-3 w-3" /> {new Date(c.fecha_registro).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                        {c.terminos_pago || 'Contado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.estatus === 'pendiente' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold"><ShieldAlert className="h-3.5 w-3.5"/> Pendiente</span>}
                      {c.estatus === 'aprobado' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"><ShieldCheck className="h-3.5 w-3.5"/> Aprobado</span>}
                      {c.estatus === 'rechazado' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">Rechazado</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-brand-600 transition-colors inline-flex items-center gap-2 text-xs font-bold"
                      >
                        <Edit2 className="h-4 w-4" /> Administrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Administrar Cliente B2B">
        {clienteSelect && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">{clienteSelect.empresa}</h4>
              <p className="text-sm text-slate-600">{clienteSelect.nombre_completo} ({clienteSelect.email})</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Estatus de Aprobación</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={editEstatus}
                onChange={(e: any) => setEditEstatus(e.target.value)}
              >
                <option value="pendiente">Pendiente (Sin acceso B2B)</option>
                <option value="aprobado">Aprobado (Acceso B2B activo)</option>
                <option value="rechazado">Rechazado (Bloqueado)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Términos de Pago</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                value={editTerminos}
                onChange={(e: any) => setEditTerminos(e.target.value)}
              >
                <option value="Contado">Contado</option>
                <option value="Crédito 8 Días">Crédito 8 Días</option>
                <option value="Crédito 15 Días">Crédito 15 Días</option>
                <option value="Crédito 30 Días">Crédito 30 Días</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Estas condiciones aparecerán en sus cotizaciones formales.</p>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
