'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MapPin, Building, User, Mail, Phone, FileText, CheckCircle, Loader2, Save } from 'lucide-react';

export default function MisDatosPage() {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState<string>('');
  const [form, setForm] = useState({
    nombre_completo: '',
    empresa: '',
    puesto: '',
    email: '',
    telefono: '',
    rfc: '',
    calle: '',
    num_exterior: '',
    num_interior: '',
    colonia: '',
    codigo_postal: '',
    ciudad: '',
    estado: '',
    descuento_porcentaje: 0,
    terminos_pago: 'Contado',
  });

  const [loadingCP, setLoadingCP] = useState(false);
  const [sugerenciasColonias, setSugerenciasColonias] = useState<string[]>([]);
  const [esColoniaManual, setEsColoniaManual] = useState(false);

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setClienteId(session.user.id);

      const { data, error } = await supabase
        .from('perfiles_clientes')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setForm({
          nombre_completo: data.nombre_completo || '',
          empresa: data.empresa || '',
          puesto: data.puesto || '',
          email: data.email || session.user.email || '',
          telefono: data.telefono || '',
          rfc: data.rfc || '',
          calle: data.calle || '',
          num_exterior: data.num_exterior || '',
          num_interior: data.num_interior || '',
          colonia: data.colonia || '',
          codigo_postal: data.codigo_postal || '',
          ciudad: data.ciudad || '',
          estado: data.estado || '',
          descuento_porcentaje: data.descuento_porcentaje || 0,
          terminos_pago: data.terminos_pago || 'Contado',
        });
      }
      setLoading(false);
    }

    cargarPerfil();
  }, []);

  const handleCPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setForm(prev => ({ ...prev, codigo_postal: val }));
    if (val.length === 5) {
      setLoadingCP(true);
      try {
        const res = await fetch(`/api/sepomex?cp=${val}`);
        if (res.ok) {
          const data = await res.json();
          if (data.estado) {
            const colonias = data.colonias || [];
            setSugerenciasColonias(colonias);
            setEsColoniaManual(false);
            setForm(prev => ({
              ...prev,
              estado: data.estado,
              ciudad: data.ciudad || data.municipio || prev.ciudad,
              colonia: colonias.length === 1 ? colonias[0] : (colonias.length > 0 ? (colonias.includes(prev.colonia) ? prev.colonia : colonias[0]) : prev.colonia)
            }));
          }
        }
      } catch (err) {
        // En caso de falla, el usuario puede teclear manualmente
      } finally {
        setLoadingCP(false);
      }
    } else {
      setSugerenciasColonias([]);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorStr(null);
    setMensajeExito(false);

    try {
      const { error } = await supabase
        .from('perfiles_clientes')
        .update({
          nombre_completo: form.nombre_completo,
          empresa: form.empresa,
          puesto: form.puesto,
          telefono: form.telefono,
          rfc: form.rfc,
          calle: form.calle,
          num_exterior: form.num_exterior,
          num_interior: form.num_interior,
          colonia: form.colonia,
          codigo_postal: form.codigo_postal,
          ciudad: form.ciudad,
          estado: form.estado,
        })
        .eq('id', clienteId);

      if (error) throw error;
      setMensajeExito(true);
      setTimeout(() => setMensajeExito(false), 4000);
    } catch (err: any) {
      setErrorStr(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-200 gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-600" />
            Mis Datos y Dirección
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mantén actualizada tu información comercial y ubicación para calcular fletes con precisión.
          </p>
        </div>

        {form.descuento_porcentaje > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-300 px-4 py-2 rounded-xl text-left sm:text-right">
            <span className="text-xs font-semibold text-emerald-800 block">Descuento Preferencial Activo:</span>
            <span className="text-base font-extrabold text-emerald-900">{form.descuento_porcentaje}% de Descuento</span>
          </div>
        )}
      </div>

      {mensajeExito && (
        <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 text-sm font-medium">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Tus datos y dirección han sido actualizados con éxito!</span>
        </div>
      )}

      {errorStr && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-medium">
          Error: {errorStr}
        </div>
      )}

      <form onSubmit={handleGuardar} className="space-y-8">
        
        {/* Bloque 1: Empresa y Contacto */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-slate-600" />
            Información de la Empresa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Nombre Completo *</label>
              <input
                required
                type="text"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Razón Social / Empresa *</label>
              <input
                required
                type="text"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">RFC</label>
              <input
                type="text"
                value={form.rfc}
                onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm uppercase transition-all focus:outline-none"
                placeholder="ABC123456T1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Puesto o Departamento</label>
              <input
                type="text"
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                placeholder="Ej. Comprador / Almacén"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Teléfono Directo *</label>
              <input
                required
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Correo Electrónico (Acceso)</label>
              <input
                disabled
                type="email"
                value={form.email}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-200 bg-slate-100 text-slate-600 font-medium text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Dirección de Envío */}
        <div className="border-t-2 border-slate-200 pt-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-600" />
              Dirección de Envío Principal
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Esta ubicación se usará de forma predeterminada para calcular tus costos de flete en el cotizador.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Código Postal (5 dígitos) *</label>
              <input
                required
                maxLength={5}
                type="text"
                value={form.codigo_postal}
                onChange={handleCPChange}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-bold tracking-wide text-sm transition-all focus:outline-none"
                placeholder="Ej. 31124"
              />
              {loadingCP && <span className="text-[11px] text-brand-600 font-medium mt-1 block">Buscando ciudad...</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Estado *</label>
              <input
                required
                type="text"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                placeholder="Ej. Chihuahua"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Ciudad o Municipio *</label>
              <input
                required
                type="text"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                placeholder="Ej. Chihuahua"
              />
            </div>

            <div className="sm:col-span-3">
              {sugerenciasColonias.length > 0 && !esColoniaManual ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Colonia / Fraccionamiento <span className="text-slate-500 font-normal">({sugerenciasColonias.length} opciones detectadas)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setEsColoniaManual(true)}
                      className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                    >
                      ✏️ Escribir otra manualmente
                    </button>
                  </div>
                  <select
                    value={form.colonia}
                    onChange={(e) => {
                      if (e.target.value === '__OTRA__') {
                        setEsColoniaManual(true);
                        setForm(prev => ({ ...prev, colonia: '' }));
                      } else {
                        setForm(prev => ({ ...prev, colonia: e.target.value }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm cursor-pointer shadow-sm transition-all focus:outline-none"
                  >
                    <option value="">-- Selecciona tu colonia ({sugerenciasColonias.length} disponibles) --</option>
                    {sugerenciasColonias.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                    <option value="__OTRA__">✏️ Otra colonia (no está en la lista)...</option>
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Colonia / Fraccionamiento <span className="text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    {sugerenciasColonias.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEsColoniaManual(false);
                          if (!form.colonia && sugerenciasColonias.length > 0) {
                            setForm(prev => ({ ...prev, colonia: sugerenciasColonias[0] }));
                          }
                        }}
                        className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                      >
                        📋 Ver lista desplegable ({sugerenciasColonias.length})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.colonia}
                    onChange={(e) => setForm({ ...form, colonia: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                    placeholder="Ej. Complejo Industrial Chihuahua, Misión Universidad..."
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800 mb-1">Calle <span className="text-slate-500 font-normal">(Opcional para primer pedido)</span></label>
              <input
                type="text"
                value={form.calle}
                onChange={(e) => setForm({ ...form, calle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                placeholder="Av. De las Industrias..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">No. Exterior</label>
                <input
                  type="text"
                  value={form.num_exterior}
                  onChange={(e) => setForm({ ...form, num_exterior: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">No. Interior</label>
                <input
                  type="text"
                  value={form.num_interior}
                  onChange={(e) => setForm({ ...form, num_interior: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-300 hover:border-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 bg-white text-slate-900 font-medium text-sm transition-all focus:outline-none"
                  placeholder="Bodega B"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {guardando ? 'Guardando cambios...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
}
