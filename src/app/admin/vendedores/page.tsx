'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { 
  obtenerVendedores, 
  crearVendedor, 
  actualizarVendedor, 
  eliminarVendedor, 
  Vendedor 
} from './actions';

export default function VendedoresAdminPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [vendedorSelect, setVendedorSelect] = useState<Vendedor | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [activo, setActivo] = useState(true);

  const cargarVendedores = async () => {
    setLoading(true);
    const res = await obtenerVendedores();
    if (res.success && res.data) {
      setVendedores(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarVendedores();
  }, []);

  const abrirModalNuevo = () => {
    setVendedorSelect(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setActivo(true);
    setErrorStr(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (v: Vendedor) => {
    setVendedorSelect(v);
    setNombre(v.nombre);
    setTelefono(v.telefono);
    setEmail(v.email);
    setActivo(v.activo);
    setErrorStr(null);
    setModalOpen(true);
  };

  const guardarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !email.trim()) {
      setErrorStr('Por favor completa todos los campos.');
      return;
    }

    setGuardando(true);
    setErrorStr(null);

    let res;
    if (vendedorSelect) {
      res = await actualizarVendedor(vendedorSelect.id, {
        nombre,
        telefono,
        email,
        activo,
      });
    } else {
      res = await crearVendedor({
        nombre,
        telefono,
        email,
      });
    }

    setGuardando(false);
    if (!res.success) {
      setErrorStr(res.error || 'Ocurrió un error al guardar el vendedor.');
    } else {
      setModalOpen(false);
      cargarVendedores();
    }
  };

  const handleEliminar = async (v: Vendedor) => {
    const msg = v.clientes_count && v.clientes_count > 0
      ? `¿Estás seguro de eliminar a ${v.nombre}? Tiene ${v.clientes_count} clientes asignados que quedarán sin vendedor.`
      : `¿Estás seguro de eliminar a ${v.nombre}?`;

    if (!window.confirm(msg)) return;

    const res = await eliminarVendedor(v.id);
    if (!res.success) {
      alert('Error: ' + res.error);
    } else {
      cargarVendedores();
    }
  };

  const vendedoresFiltrados = vendedores.filter(v => 
    v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.telefono.includes(busqueda)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            Equipo de Vendedores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra a tus asesores comerciales para asignarlos a clientes específicos y redirigir su contacto directo.
          </p>
        </div>

        <button
          onClick={abrirModalNuevo}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/20 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar vendedor por nombre, correo o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
      </div>

      {/* Tabla de Vendedores */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : vendedoresFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {busqueda ? 'No se encontraron vendedores que coincidan con la búsqueda.' : 'Aún no tienes vendedores registrados. Haz clic en "Nuevo Vendedor" para dar de alta al primero.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4">Teléfono / WhatsApp</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4 text-center">Clientes Asignados</th>
                  <th className="px-6 py-4 text-center">Estatus</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendedoresFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-base">{v.nombre}</div>
                      <div className="text-xs text-slate-400">Registrado: {new Date(v.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://wa.me/52${v.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 text-sm"
                      >
                        <Phone className="h-4 w-4" />
                        {v.telefono}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${v.email}`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand-600 hover:underline text-sm"
                      >
                        <Mail className="h-4 w-4 text-slate-400" />
                        {v.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {v.clientes_count || 0} cliente(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {v.activo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          <XCircle className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(v)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold border border-red-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-slate-900">
              {vendedorSelect ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h2>
            <p className="text-xs text-slate-500">
              Ingresa los datos del vendedor. Estos se mostrarán en la página web y en WhatsApp a los clientes que tenga asignados.
            </p>

            <form onSubmit={guardarVendedor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 6141234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 text-sm font-semibold text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  A este número se abrirá el chat de WhatsApp cuando el cliente solicite atención.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. juan.perez@remindustrial.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-brand-500 text-sm font-semibold text-slate-800"
                />
              </div>

              {vendedorSelect && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="activo-check"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <label htmlFor="activo-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Vendedor Activo en el Sistema
                  </label>
                </div>
              )}

              {errorStr && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorStr}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={guardando}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md shadow-brand-600/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {vendedorSelect ? 'Actualizar' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
