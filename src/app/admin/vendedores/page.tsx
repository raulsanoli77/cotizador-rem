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
  AlertCircle,
  Camera,
  X,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
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
  const [fotoUrl, setFotoUrl] = useState('');
  const [activo, setActivo] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

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
    setFotoUrl('');
    setActivo(true);
    setErrorStr(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (v: Vendedor) => {
    setVendedorSelect(v);
    setNombre(v.nombre);
    setTelefono(v.telefono);
    setEmail(v.email);
    setFotoUrl(v.foto_url || '');
    setActivo(v.activo);
    setErrorStr(null);
    setModalOpen(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubiendoFoto(true);
      setErrorStr(null);
      const fileExt = file.name.split('.').pop();
      const fileName = `vendedor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `vendedores/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      setFotoUrl(data.publicUrl);
    } catch (err: any) {
      setErrorStr('Error al subir la imagen: ' + err.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !email.trim()) {
      setErrorStr('Por favor completa todos los campos obligatorios.');
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
        foto_url: fotoUrl.trim() || null,
        activo,
      });
    } else {
      res = await crearVendedor({
        nombre,
        telefono,
        email,
        foto_url: fotoUrl.trim() || null,
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
    <div className="w-full space-y-6">
      
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
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-600/20 transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Vendedor
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
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

      {/* Tabla de Vendedores Optimizada sin Scroll Lateral */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : vendedoresFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {busqueda ? 'No se encontraron vendedores que coincidan con la búsqueda.' : 'Aún no tienes vendedores registrados. Haz clic en "Nuevo Vendedor" para dar de alta al primero.'}
          </div>
        ) : (
          <div className="w-full overflow-x-hidden">
            <table className="w-full text-left text-sm table-auto">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Vendedor</th>
                  <th className="px-3 py-3.5">Teléfono / WhatsApp</th>
                  <th className="px-3 py-3.5">Correo Electrónico</th>
                  <th className="px-3 py-3.5 text-center">Clientes</th>
                  <th className="px-3 py-3.5 text-center">Estatus</th>
                  <th className="px-4 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendedoresFiltrados.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Vendedor + Foto */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {v.foto_url ? (
                          <img 
                            src={v.foto_url} 
                            alt={v.nombre} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-sm border border-brand-200">
                            {v.nombre.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{v.nombre}</div>
                          <div className="text-[11px] text-slate-400">Reg: {new Date(v.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Teléfono / WhatsApp */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <a
                        href={`https://wa.me/52${v.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm"
                        title="Abrir chat en WhatsApp"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{v.telefono}</span>
                      </a>
                    </td>

                    {/* Correo Electrónico */}
                    <td className="px-3 py-3">
                      <a
                        href={`mailto:${v.email}`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand-600 hover:underline text-xs sm:text-sm truncate max-w-[200px]"
                        title={v.email}
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{v.email}</span>
                      </a>
                    </td>

                    {/* Clientes Asignados */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {v.clientes_count || 0} cliente(s)
                      </span>
                    </td>

                    {/* Estatus */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {v.activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirModalEditar(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          title="Editar asesor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(v)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200 transition-colors"
                          title="Eliminar asesor"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">
              {vendedorSelect ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h2>
            <p className="text-xs text-slate-500">
              Ingresa los datos del vendedor. Estos se mostrarán en la página web y en WhatsApp a los clientes que tenga asignados.
            </p>

            <form onSubmit={guardarVendedor} className="space-y-4">
              
              {/* Selector / Subir Foto */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">Fotografía del Asesor</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-sm">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                    {subiendoFoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-brand-600" />
                        <span>{subiendoFoto ? 'Subiendo...' : (fotoUrl ? 'Cambiar Foto' : 'Subir Foto')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSubirFoto}
                          disabled={subiendoFoto}
                        />
                      </label>
                      {fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFotoUrl('')}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
                          title="Eliminar foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">Se mostrará en su perfil y atención al cliente.</p>
                  </div>
                </div>
              </div>

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
                  disabled={guardando || subiendoFoto}
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
