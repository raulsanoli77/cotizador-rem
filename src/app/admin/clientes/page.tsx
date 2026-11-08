'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Loader2,
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  MessageCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

type Vendedor = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  activo: boolean;
};

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
  rol?: string;
  calle?: string;
  num_exterior?: string;
  num_interior?: string;
  colonia?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  descuento_porcentaje?: number;
  puesto?: string;
  perfil_empresa?: string;
  pagina_web?: string;
  vendedor_id?: string | null;
  vendedor?: {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
    foto_url?: string | null;
  } | null;
};

import { actualizarEstatusCliente, eliminarCliente, crearClienteAdmin } from './actions';

type CredencialesCreadas = {
  nombre: string;
  empresa: string;
  email: string;
  password: string;
  telefono: string;
  terminos: string;
  vendedorNombre?: string;
};

export default function ClientesB2BPage() {
  const [clientes, setClientes] = useState<PerfilCliente[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  
  // Modal states (Administrar Cliente existente)
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSelect, setClienteSelect] = useState<PerfilCliente | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [editNuevaPassword, setEditNuevaPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Modal states (Crear Nuevo Cliente)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(true);
  const [credencialesCreadas, setCredencialesCreadas] = useState<CredencialesCreadas | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [loadingNewCP, setLoadingNewCP] = useState(false);
  const [coloniasNewCP, setColoniasNewCP] = useState<string[]>([]);
  const [esColoniaManualNew, setEsColoniaManualNew] = useState(false);

  const [newForm, setNewForm] = useState({
    empresa: '',
    nombre_completo: '',
    email: '',
    password: '',
    telefono: '',
    rfc: '',
    puesto: '',
    perfil_empresa: 'Usuario Final (Planta, Taller, Maquinados)',
    pagina_web: '',
    estatus: 'aprobado' as 'pendiente' | 'aprobado' | 'rechazado',
    vendedor_id: '',
    terminos_pago: 'Contado',
    descuento_porcentaje: 0,
    rol: 'cliente',
    codigo_postal: '',
    estado: '',
    ciudad: '',
    colonia: '',
    calle: '',
    num_exterior: '',
    num_interior: '',
    enviar_correo: true,
  });

  // Form states (Editar)
  const [editEstatus, setEditEstatus] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [editTerminos, setEditTerminos] = useState('Contado');
  const [editRol, setEditRol] = useState('cliente');
  const [editVendedorId, setEditVendedorId] = useState<string>('');
  
  // Módulo 4 y 5: Campos extra
  const [editDescuento, setEditDescuento] = useState(0);
  const [editCalle, setEditCalle] = useState('');
  const [editNumExt, setEditNumExt] = useState('');
  const [editNumInt, setEditNumInt] = useState('');
  const [editColonia, setEditColonia] = useState('');
  const [editCiudad, setEditCiudad] = useState('');
  const [editEstado, setEditEstado] = useState('');
  const [editCP, setEditCP] = useState('');

  // Info base de registro
  const [editNombreCompleto, setEditNombreCompleto] = useState('');
  const [editPuesto, setEditPuesto] = useState('');
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editPerfilEmpresa, setEditPerfilEmpresa] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRfc, setEditRfc] = useState('');
  const [editPaginaWeb, setEditPaginaWeb] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id || null);
    });
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    const [clientesRes, vendedoresRes] = await Promise.all([
      supabase
        .from('perfiles_clientes')
        .select('*, vendedor:vendedores(id, nombre, telefono, email, foto_url)')
        .order('fecha_registro', { ascending: false }),
      supabase
        .from('vendedores')
        .select('*')
        .order('nombre')
    ]);

    if (clientesRes.error) {
      console.error('Error cargando clientes:', clientesRes.error);
    } else {
      setClientes(clientesRes.data || []);
    }

    if (vendedoresRes.error) {
      console.error('Error cargando vendedores:', vendedoresRes.error);
    } else {
      setVendedores(vendedoresRes.data || []);
    }

    setLoading(false);
  };

  const generarPasswordSugerida = (empresaVal?: string) => {
    const base = (empresaVal ?? newForm.empresa)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4);
    const prefijo = base.length >= 3
      ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase()
      : 'Rem';
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefijo}${num}*`;
  };

  const handleOpenCreateModal = () => {
    setCredencialesCreadas(null);
    setCopiado(false);
    setColoniasNewCP([]);
    setEsColoniaManualNew(false);
    setNewForm({
      empresa: '',
      nombre_completo: '',
      email: '',
      password: 'Rem' + Math.floor(1000 + Math.random() * 9000) + '*',
      telefono: '',
      rfc: '',
      puesto: 'Compras / Ingeniería',
      perfil_empresa: 'Usuario Final (Planta, Taller, Maquinados)',
      pagina_web: '',
      estatus: 'aprobado',
      vendedor_id: '',
      terminos_pago: 'Contado',
      descuento_porcentaje: 0,
      rol: 'cliente',
      codigo_postal: '',
      estado: '',
      ciudad: '',
      colonia: '',
      calle: '',
      num_exterior: '',
      num_interior: '',
      enviar_correo: true,
    });
    setCreateModalOpen(true);
  };

  const handleNewCPChange = async (val: string) => {
    const clean = val.trim();
    setNewForm((prev) => ({ ...prev, codigo_postal: clean }));
    if (clean.length === 5) {
      setLoadingNewCP(true);
      try {
        const res = await fetch(`/api/sepomex?cp=${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data.estado) {
            const cols: string[] = data.colonias || [];
            setColoniasNewCP(cols);
            setEsColoniaManualNew(false);
            setNewForm((prev) => ({
              ...prev,
              estado: data.estado,
              ciudad: data.ciudad || data.municipio || prev.ciudad,
              colonia: cols.length > 0 ? cols[0] : prev.colonia,
            }));
          }
        }
      } catch (_) {
        // Ignorar si falla SEPOMEX
      } finally {
        setLoadingNewCP(false);
      }
    } else {
      setColoniasNewCP([]);
      setEsColoniaManualNew(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    try {
      await crearClienteAdmin(newForm);
      const vendedorObj = vendedores.find((v) => v.id === newForm.vendedor_id);
      setCredencialesCreadas({
        nombre: newForm.nombre_completo.trim(),
        empresa: newForm.empresa.trim(),
        email: newForm.email.trim().toLowerCase(),
        password: newForm.password.trim(),
        telefono: newForm.telefono.trim(),
        terminos: newForm.terminos_pago,
        vendedorNombre: vendedorObj?.nombre,
      });
      cargarClientes();
    } catch (error: any) {
      alert('Error al crear cliente: ' + error.message);
    } finally {
      setCreando(false);
    }
  };

  const construirMensajeBienvenida = (cred: CredencialesCreadas) => {
    const urlLogin =
      typeof window !== 'undefined'
        ? `${window.location.origin}/admin/login`
        : 'https://cotizador-rem.vercel.app/admin/login';
    return (
      `Hola ${cred.nombre}, te compartimos tu acceso empresarial al nuevo *Catálogo y Cotizador Online de REM Industrial* para *${cred.empresa}*:\n\n` +
      `🔗 *Portal:* ${urlLogin}\n` +
      `👤 *Usuario:* ${cred.email}\n` +
      `🔑 *Contraseña:* ${cred.password}\n` +
      `📋 *Condiciones:* ${cred.terminos}\n` +
      (cred.vendedorNombre ? `🤝 *Asesor asignado:* ${cred.vendedorNombre}\n` : '') +
      `\nTu cuenta ya está aprobada y lista con tus precios preferenciales.`
    );
  };

  const handleCopiarCredenciales = async () => {
    if (!credencialesCreadas) return;
    try {
      await navigator.clipboard.writeText(construirMensajeBienvenida(credencialesCreadas));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (_) {
      alert('No se pudo copiar automáticamente.');
    }
  };

  const handleEdit = (c: PerfilCliente) => {
    setClienteSelect(c);
    setEditNuevaPassword('');
    setShowEditPassword(false);
    setEditEstatus(c.estatus);
    setEditTerminos(c.terminos_pago || 'Contado');
    setEditRol(c.rol || 'cliente');
    setEditVendedorId(c.vendedor_id || '');
    setEditDescuento(c.descuento_porcentaje || 0);
    setEditCalle(c.calle || '');
    setEditNumExt(c.num_exterior || '');
    setEditNumInt(c.num_interior || '');
    setEditColonia(c.colonia || '');
    setEditCiudad(c.ciudad || '');
    setEditEstado(c.estado || '');
    setEditCP(c.codigo_postal || '');
    setEditNombreCompleto(c.nombre_completo || '');
    setEditPuesto(c.puesto || '');
    setEditEmpresa(c.empresa || '');
    setEditPerfilEmpresa(c.perfil_empresa || '');
    setEditTelefono(c.telefono || '');
    setEditRfc(c.rfc || '');
    setEditPaginaWeb(c.pagina_web || '');
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
        editNombreCompleto,
        editEstatus,
        editTerminos,
        editRol,
        editDescuento,
        editCalle,
        editNumExt,
        editNumInt,
        editColonia,
        editCiudad,
        editEstado,
        editCP,
        editNombreCompleto,
        editPuesto,
        editEmpresa,
        editPerfilEmpresa,
        editTelefono,
        editRfc,
        editPaginaWeb,
        editVendedorId || null,
        editNuevaPassword.trim() || undefined
      );
      setModalOpen(false);
      cargarClientes();
    } catch (error: any) {
      alert('Error al actualizar: ' + error.message);
    }
    setGuardando(false);
  };

  const handleDelete = async (c: PerfilCliente) => {
    if (currentUserId && c.id === currentUserId) {
      alert('Por seguridad, no puedes eliminar tu propia cuenta de administrador activa.');
      return;
    }

    const nombreMostrar = c.empresa || c.nombre_completo || c.email;
    const avisoRol = c.rol === 'admin' ? '\n\n⚠️ ATENCIÓN: Este usuario tiene rol de ADMINISTRADOR.' : '';
    const confirmar = confirm(
      `¿Estás seguro de eliminar permanentemente al cliente "${nombreMostrar}" (${c.email})?${avisoRol}\n\nSe eliminará su perfil, acceso y solicitudes asociadas.`
    );
    if (!confirmar) return;

    setEliminandoId(c.id);
    try {
      await eliminarCliente(c.id, currentUserId || undefined);
      setClientes((prev) => prev.filter((item) => item.id !== c.id));
      if (clienteSelect?.id === c.id) {
        setModalOpen(false);
        setClienteSelect(null);
      }
    } catch (error: any) {
      alert('Error al eliminar cliente: ' + error.message);
    } finally {
      setEliminandoId(null);
    }
  };

  const filtrados = clientes.filter(c => 
    c.empresa?.toLowerCase().includes(busqueda.toLowerCase()) || 
    c.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            Clientes Registrados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona aprobaciones, accesos y términos de pago de tus clientes.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar empresa, nombre..."
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm w-64 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-hidden">
          <table className="w-full text-left text-sm text-slate-600 table-auto">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Empresa / Cliente</th>
                <th className="px-3 py-3.5">Contacto</th>
                <th className="px-3 py-3.5">Vendedor Asignado</th>
                <th className="px-3 py-3.5">Términos Comerciales</th>
                <th className="px-3 py-3.5">Estatus</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
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
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs"><Mail className="h-3 w-3" /> {c.email}</span>
                        <span className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3" /> {c.telefono || 'Sin teléfono'}</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1"><Calendar className="h-3 w-3" /> {new Date(c.fecha_registro).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {c.vendedor ? (
                        <div className="flex items-center gap-2.5">
                          {c.vendedor.foto_url ? (
                            <img 
                              src={c.vendedor.foto_url} 
                              alt={c.vendedor.nombre} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-sm" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-xs border border-brand-200">
                              {c.vendedor.nombre.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {c.vendedor.nombre}
                            </span>
                            <span className="text-[11px] text-slate-500">{c.vendedor.telefono}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-400">
                          Sin asignar (General)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                        {c.terminos_pago || 'Contado'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        {c.estatus === 'pendiente' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold"><ShieldAlert className="h-3.5 w-3.5"/> Pendiente</span>}
                        {c.estatus === 'aprobado' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"><ShieldCheck className="h-3.5 w-3.5"/> Aprobado</span>}
                        {c.estatus === 'rechazado' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">Rechazado</span>}
                        
                        {c.rol === 'admin' ? (
                          <span className="inline-flex px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">ADMIN</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">CLIENTE</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-brand-600 transition-colors inline-flex items-center gap-2 text-xs font-bold"
                        >
                          <Edit2 className="h-4 w-4" /> Administrar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={eliminandoId === c.id || (currentUserId !== null && c.id === currentUserId)}
                          title={
                            currentUserId && c.id === currentUserId
                              ? 'No puedes eliminar tu propia cuenta activa'
                              : 'Eliminar cliente'
                          }
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {eliminandoId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && clienteSelect && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Administrar Cliente</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                  <h4 className="font-semibold text-sm text-slate-700 mb-4 border-b border-slate-200 pb-2">Información Principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                      <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editNombreCompleto} onChange={(e) => setEditNombreCompleto(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa</label>
                      <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editEmpresa} onChange={(e) => setEditEmpresa(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">RFC</label>
                      <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editRfc} onChange={(e) => setEditRfc(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto</label>
                      <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editPuesto} onChange={(e) => setEditPuesto(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                      <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Empresa</label>
                      <select className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm" value={editPerfilEmpresa} onChange={(e) => setEditPerfilEmpresa(e.target.value)}>
                        <option value="Usuario Final">Usuario Final</option>
                        <option value="Integrador / Revendedor">Integrador / Revendedor</option>
                        <option value="Fabricante">Fabricante</option>
                        <option value="Estudiante / Educativo">Estudiante / Educativo</option>
                        <option value="Gobierno">Gobierno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Acceso)</label>
                      <input type="email" className="w-full border border-slate-300 bg-slate-100 text-slate-500 rounded-lg px-3 py-1.5 text-sm" value={clienteSelect.email} disabled />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <KeyRound className="h-3.5 w-3.5 text-brand-600" />
                        Asignar Nueva Contraseña <span className="text-slate-400 font-normal">(Opcional - dejar vacío para no cambiar)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          minLength={6}
                          placeholder="Escribe una nueva contraseña si el cliente olvidó su acceso..."
                          className="w-full border border-slate-300 rounded-lg pl-3 pr-9 py-1.5 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                          value={editNuevaPassword}
                          onChange={(e) => setEditNuevaPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estatus de Aprobación</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={editEstatus}
                    onChange={(e: any) => setEditEstatus(e.target.value)}
                  >
                    <option value="pendiente">Pendiente (Sin precio preferencial)</option>
                    <option value="aprobado">Aprobado (Precios preferenciales activos)</option>
                    <option value="rechazado">Rechazado (Bloqueado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rol en la Plataforma</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={editRol}
                    onChange={(e: any) => setEditRol(e.target.value)}
                  >
                    <option value="cliente">Cliente Registrado (Estándar)</option>
                    <option value="admin">Administrador (Acceso Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Vendedor Asignado</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={editVendedorId}
                    onChange={(e) => setEditVendedorId(e.target.value)}
                  >
                    <option value="">-- Sin Vendedor Asignado (General) --</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre} ({v.telefono} - {v.email}) {!v.activo ? '[Inactivo]' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    El cliente verá a este vendedor como su contacto directo en toda la plataforma.
                  </p>
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
                    <option value="Crédito 45 Días">Crédito 45 Días</option>
                    <option value="Crédito 60 Días">Crédito 60 Días</option>
                    <option value="Crédito 75 Días">Crédito 75 Días</option>
                    <option value="Crédito 90 Días">Crédito 90 Días</option>
                    <option value="Crédito 105 Días">Crédito 105 Días</option>
                    <option value="Crédito 120 Días">Crédito 120 Días</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Estas condiciones aparecerán en sus cotizaciones formales.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Descuento Permanente (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={editDescuento}
                    onChange={(e: any) => setEditDescuento(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-slate-500 mt-1">Este descuento se aplicará a todas sus cotizaciones (Base 100 = Sin Descuento).</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-700 mb-4">Información de Envío / Facturación</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Calle</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editCalle}
                        onChange={(e: any) => setEditCalle(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Num Exterior</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editNumExt}
                        onChange={(e: any) => setEditNumExt(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Num Interior (Opcional)</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editNumInt}
                        onChange={(e: any) => setEditNumInt(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Colonia</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editColonia}
                        onChange={(e: any) => setEditColonia(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editCP}
                        onChange={(e: any) => setEditCP(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editCiudad}
                        onChange={(e: any) => setEditCiudad(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={editEstado}
                        onChange={(e: any) => setEditEstado(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-slate-100">
                  {(!currentUserId || clienteSelect.id !== currentUserId) ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(clienteSelect)}
                      disabled={eliminandoId === clienteSelect.id || guardando}
                      className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {eliminandoId === clienteSelect.id ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Eliminando...</>
                      ) : (
                        <><Trash2 className="h-3.5 w-3.5" /> Eliminar Cliente</>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">Tu cuenta actual</span>
                  )}

                  <div className="flex items-center gap-3">
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
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  {credencialesCreadas ? '¡Cuenta de Cliente Creada!' : 'Dar de Alta Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {credencialesCreadas ? (
              <div className="p-6 space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">
                      El cliente ya puede entrar al catálogo con precios preferenciales
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Comparte estos datos de acceso con tu cliente por WhatsApp o correo electrónico.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 rounded-xl p-5 space-y-2.5 text-sm font-mono border border-slate-800">
                  <div className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Empresa:</span>
                    <span className="font-bold text-white">{credencialesCreadas.empresa}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Contacto:</span>
                    <span className="text-slate-200">{credencialesCreadas.nombre}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Usuario (Correo):</span>
                    <span className="font-bold text-cyan-400">{credencialesCreadas.email}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Contraseña:</span>
                    <span className="font-bold text-amber-300">{credencialesCreadas.password}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Términos:</span>
                    <span className="text-emerald-400 font-semibold">{credencialesCreadas.terminos}</span>
                  </div>
                  {credencialesCreadas.vendedorNombre && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Asesor asignado:</span>
                      <span className="text-slate-200">{credencialesCreadas.vendedorNombre}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCopiarCredenciales}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiado ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        ¡Mensaje copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-600" />
                        Copiar mensaje de bienvenida
                      </>
                    )}
                  </button>

                  <a
                    href={
                      credencialesCreadas.telefono
                        ? `https://wa.me/52${credencialesCreadas.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                            construirMensajeBienvenida(credencialesCreadas)
                          )}`
                        : `https://wa.me/?text=${encodeURIComponent(construirMensajeBienvenida(credencialesCreadas))}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar acceso por WhatsApp
                  </a>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800"
                  >
                    + Dar de alta otro cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-5 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  {/* Datos Principales y Credenciales */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3 border-b border-slate-200 pb-2">
                      1. Datos del Cliente y Acceso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa *</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej. Maquinados Industriales S.A."
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.empresa}
                          onChange={(e) => setNewForm({ ...newForm, empresa: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo (Contacto) *</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej. Ing. Roberto Gómez"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.nombre_completo}
                          onChange={(e) => setNewForm({ ...newForm, nombre_completo: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico (Usuario) *</label>
                        <input
                          required
                          type="email"
                          placeholder="compras@empresa.com"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.email}
                          onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">Contraseña Inicial *</label>
                          <button
                            type="button"
                            onClick={() =>
                              setNewForm((prev) => ({
                                ...prev,
                                password: generarPasswordSugerida(prev.empresa),
                              }))
                            }
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" /> Generar otra
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            required
                            minLength={6}
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full border border-slate-300 rounded-lg pl-3 pr-9 py-1.5 text-sm bg-white font-mono"
                            value={newForm.password}
                            onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          placeholder="656 000 0000"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.telefono}
                          onChange={(e) => setNewForm({ ...newForm, telefono: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">RFC (Opcional)</label>
                        <input
                          type="text"
                          placeholder="ABC123456T1"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white uppercase"
                          value={newForm.rfc}
                          onChange={(e) => setNewForm({ ...newForm, rfc: e.target.value.toUpperCase() })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Puesto</label>
                        <input
                          type="text"
                          placeholder="Compras / Mantenimiento"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.puesto}
                          onChange={(e) => setNewForm({ ...newForm, puesto: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Perfil de Empresa</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.perfil_empresa}
                          onChange={(e) => setNewForm({ ...newForm, perfil_empresa: e.target.value })}
                        >
                          <option value="Usuario Final (Planta, Taller, Maquinados)">Usuario Final (Planta, Taller, Maquinados)</option>
                          <option value="Distribuidor / Revendedor">Distribuidor / Revendedor</option>
                          <option value="Integrador / Revendedor">Integrador / Revendedor</option>
                          <option value="Fabricante">Fabricante</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Configuración Comercial */}
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3 border-b border-blue-100 pb-2">
                      2. Condiciones Comerciales y Vendedor Asignado
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Vendedor Asignado</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.vendedor_id}
                          onChange={(e) => setNewForm({ ...newForm, vendedor_id: e.target.value })}
                        >
                          <option value="">-- Sin Vendedor Asignado (General) --</option>
                          {vendedores.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nombre} ({v.telefono}) {!v.activo ? '[Inactivo]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Términos de Pago</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.terminos_pago}
                          onChange={(e) => setNewForm({ ...newForm, terminos_pago: e.target.value })}
                        >
                          <option value="Contado">Contado</option>
                          <option value="Crédito 8 Días">Crédito 8 Días</option>
                          <option value="Crédito 15 Días">Crédito 15 Días</option>
                          <option value="Crédito 30 Días">Crédito 30 Días</option>
                          <option value="Crédito 45 Días">Crédito 45 Días</option>
                          <option value="Crédito 60 Días">Crédito 60 Días</option>
                          <option value="Crédito 75 Días">Crédito 75 Días</option>
                          <option value="Crédito 90 Días">Crédito 90 Días</option>
                          <option value="Crédito 105 Días">Crédito 105 Días</option>
                          <option value="Crédito 120 Días">Crédito 120 Días</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Estatus Inicial</label>
                        <select
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.estatus}
                          onChange={(e: any) => setNewForm({ ...newForm, estatus: e.target.value })}
                        >
                          <option value="aprobado">Aprobado (Listo para usar)</option>
                          <option value="pendiente">Pendiente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Descuento Permanente (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          value={newForm.descuento_porcentaje}
                          onChange={(e) =>
                            setNewForm({ ...newForm, descuento_porcentaje: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ubicación Base (Opcional) */}
                  <div className="p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sm text-slate-800 mb-3 border-b border-slate-100 pb-2">
                      3. Ubicación de Entrega Base <span className="text-xs font-normal text-slate-400">(Opcional)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="Ej. 32668"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                          value={newForm.codigo_postal}
                          onChange={(e) => handleNewCPChange(e.target.value)}
                        />
                        {loadingNewCP && (
                          <span className="text-[10px] text-brand-600 font-semibold">Detectando CP...</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                        <input
                          type="text"
                          placeholder="Ej. Chihuahua"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                          value={newForm.estado}
                          onChange={(e) => setNewForm({ ...newForm, estado: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad</label>
                        <input
                          type="text"
                          placeholder="Ej. Juárez"
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                          value={newForm.ciudad}
                          onChange={(e) => setNewForm({ ...newForm, ciudad: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Colonia / Fraccionamiento / Parque Industrial
                            {coloniasNewCP.length > 0 && !esColoniaManualNew && (
                              <span className="text-slate-400 font-normal ml-1">({coloniasNewCP.length} encontradas)</span>
                            )}
                          </label>
                          {coloniasNewCP.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const nuevoEstado = !esColoniaManualNew;
                                setEsColoniaManualNew(nuevoEstado);
                                if (!nuevoEstado && !newForm.colonia && coloniasNewCP.length > 0) {
                                  setNewForm((prev) => ({ ...prev, colonia: coloniasNewCP[0] }));
                                }
                              }}
                              className="text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors"
                            >
                              {esColoniaManualNew
                                ? `📋 Ver lista (${coloniasNewCP.length})`
                                : '✏️ Escribir otra manualmente'}
                            </button>
                          )}
                        </div>

                        {coloniasNewCP.length > 0 && !esColoniaManualNew ? (
                          <select
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none cursor-pointer"
                            value={newForm.colonia}
                            onChange={(e) => {
                              if (e.target.value === '__OTRA__') {
                                setEsColoniaManualNew(true);
                                setNewForm((prev) => ({ ...prev, colonia: '' }));
                              } else {
                                setNewForm((prev) => ({ ...prev, colonia: e.target.value }));
                              }
                            }}
                          >
                            <option value="">-- Selecciona una colonia ({coloniasNewCP.length} disponibles) --</option>
                            {coloniasNewCP.map((col, idx) => (
                              <option key={idx} value={col}>
                                {col}
                              </option>
                            ))}
                            <option value="__OTRA__">✏️ Otra colonia (no está en la lista)...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Escribe el nombre de la colonia o parque industrial..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                            value={newForm.colonia}
                            onChange={(e) => setNewForm({ ...newForm, colonia: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCreateModalOpen(false)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creando}
                      className="px-5 py-2 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {creando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" /> Crear Cuenta de Cliente
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
