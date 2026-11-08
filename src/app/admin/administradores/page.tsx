'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  obtenerAdministradores,
  crearAdministrador,
  actualizarAdministrador,
  eliminarAdministrador,
  PerfilAdmin,
} from './actions';

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<PerfilAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [adminSelect, setAdminSelect] = useState<PerfilAdmin | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id || null);
    });
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    setLoading(true);
    const res = await obtenerAdministradores();
    if (res.success && res.data) {
      setAdmins(res.data);
    }
    setLoading(false);
  };

  const abrirNuevo = () => {
    setAdminSelect(null);
    setNombreCompleto('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const abrirEditar = (a: PerfilAdmin) => {
    setAdminSelect(a);
    setNombreCompleto(a.nombre_completo || '');
    setEmail(a.email);
    setPassword('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (adminSelect) {
        await actualizarAdministrador(adminSelect.id, {
          nombre_completo: nombreCompleto,
          nueva_password: password.trim() || undefined,
        });
      } else {
        await crearAdministrador({
          nombre_completo: nombreCompleto,
          email,
          password,
        });
      }
      setModalOpen(false);
      cargarAdmins();
    } catch (err: any) {
      alert(err.message || 'Error al guardar administrador.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (a: PerfilAdmin) => {
    if (currentUserId && a.id === currentUserId) {
      alert('Por seguridad, no puedes eliminar tu propia sesión activa.');
      return;
    }

    const ok = confirm(
      `¿Estás seguro de eliminar la cuenta de administrador de "${a.nombre_completo || a.email}" (${a.email})?`
    );
    if (!ok) return;

    setEliminandoId(a.id);
    try {
      await eliminarAdministrador(a.id, currentUserId || undefined);
      setAdmins((prev) => prev.filter((item) => item.id !== a.id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar administrador.');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" />
            Administradores del Sistema
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona las cuentas con acceso total al Panel de Administración de REM Industrial.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors inline-flex items-center gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Administrador
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="w-full overflow-x-hidden">
          <table className="w-full text-left text-sm text-slate-600 table-auto">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Nombre / Cuenta</th>
                <th className="px-4 py-3.5">Correo de Acceso</th>
                <th className="px-4 py-3.5">Fecha de Alta</th>
                <th className="px-4 py-3.5">Permisos</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron administradores.
                  </td>
                </tr>
              ) : (
                admins.map((a) => {
                  const esMiCuenta = currentUserId !== null && a.id === currentUserId;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-200">
                            {(a.nombre_completo || a.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {a.nombre_completo || 'Administrador REM'}
                              </p>
                              {esMiCuenta && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="h-3 w-3" /> Tu cuenta activa
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">REM Industrial</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {a.email}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {a.fecha_registro
                            ? new Date(a.fecha_registro).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" /> Acceso Total (Admin)
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirEditar(a)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(a)}
                            disabled={esMiCuenta || admins.length <= 1 || eliminandoId === a.id}
                            title={
                              esMiCuenta
                                ? 'No puedes eliminar tu propia cuenta activa'
                                : 'Eliminar administrador'
                            }
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors inline-flex items-center disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {eliminandoId === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                {adminSelect ? 'Editar Administrador' : 'Nuevo Administrador'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej. Raúl Sánchez"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico (Usuario) *
                </label>
                <input
                  required
                  type="email"
                  disabled={!!adminSelect}
                  placeholder="admin@remindustrial.mx"
                  className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none ${
                    adminSelect ? 'bg-slate-100 text-slate-500' : 'bg-white'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                  {adminSelect ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
                </label>
                <div className="relative">
                  <input
                    required={!adminSelect}
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      adminSelect
                        ? 'Dejar vacío para mantener la contraseña actual...'
                        : 'Mínimo 6 caracteres'
                    }
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="px-5 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                    </>
                  ) : adminSelect ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Administrador'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
