'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Building2, User, Mail, Phone, Globe, Briefcase, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function RegistroB2BPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    puesto: '',
    empresa: '',
    perfil_empresa: 'Usuario Final (Planta, Taller, Maquinados)',
    email: '',
    telefono: '',
    rfc: '',
    pagina_web: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre_completo: formData.nombre_completo,
            puesto: formData.puesto,
            empresa: formData.empresa,
            perfil_empresa: formData.perfil_empresa,
            telefono: formData.telefono,
            rfc: formData.rfc,
            pagina_web: formData.pagina_web,
            estatus: 'pendiente_aprobacion', // Campo clave para el Admin
          }
        }
      });

      if (authError) throw authError;

      // Insertar en la tabla perfiles_clientes para el CRM
      if (authData.user) {
        const { error: profileError } = await supabase.from('perfiles_clientes').insert({
          id: authData.user.id,
          email: formData.email,
          nombre_completo: formData.nombre_completo,
          puesto: formData.puesto,
          empresa: formData.empresa,
          perfil_empresa: formData.perfil_empresa,
          telefono: formData.telefono,
          rfc: formData.rfc,
          pagina_web: formData.pagina_web,
          estatus: 'pendiente',
          terminos_pago: 'Contado'
        });
        
        if (profileError) {
          console.error('Error al guardar perfil CRM:', profileError);
          // Opcional: Podrías hacer un rollback o alertar.
        }
      }

      setSuccess(true);
      window.scrollTo(0, 0);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-24">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          
          <div className="bg-brand-900 px-8 py-10 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-2">Portal de Clientes B2B</h2>
            <p className="text-brand-100">Regístrate para acceder a tus precios con descuento, gestión de órdenes y términos de pago.</p>
          </div>

          <div className="px-8 py-10">
            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-4">¡Registro Exitoso!</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Tu cuenta ha sido creada y enviada a revisión. Nuestro equipo de ventas validará tus datos para asignarte tu descuento y condiciones comerciales correspondientes.
                </p>
                <Link href="/" className="inline-flex items-center justify-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                  Volver al inicio
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="text"
                        name="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                  </div>

                  {/* Puesto */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Puesto o Rol *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="text"
                        name="puesto"
                        value={formData.puesto}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="Ej. Comprador / Ingeniero"
                      />
                    </div>
                  </div>

                  {/* Empresa */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="Razón social o Nombre comercial"
                      />
                    </div>
                  </div>

                  {/* Perfil */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Perfil de la Empresa *</label>
                    <select
                      required
                      name="perfil_empresa"
                      value={formData.perfil_empresa}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 px-3 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="Usuario Final (Planta, Taller, Maquinados)">Usuario Final (Planta, Taller, Maquinados)</option>
                      <option value="Distribuidor / Revendedor">Distribuidor / Revendedor</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  {/* Correo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Corporativo *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="correo@tuempresa.com"
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Directo *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="614 000 0000"
                      />
                    </div>
                  </div>

                  {/* RFC */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RFC (Empresa o Física) *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        required
                        type="text"
                        name="rfc"
                        value={formData.rfc}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm uppercase"
                        placeholder="ABC123456T1"
                      />
                    </div>
                  </div>

                  {/* Página Web */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Página Web <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="url"
                        name="pagina_web"
                        value={formData.pagina_web}
                        onChange={handleChange}
                        className="pl-10 block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                        placeholder="https://tuempresa.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 mt-8 pt-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Crea tu contraseña de acceso</h3>
                  <div className="relative max-w-md">
                    <input
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      className="block w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 px-3 text-slate-900 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Procesando registro...' : 'Crear Cuenta B2B'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                  </button>
                  <p className="text-center text-sm text-slate-500 mt-4">
                    ¿Ya tienes cuenta? <Link href="/admin/login" className="text-brand-600 hover:text-brand-800 font-bold">Inicia sesión aquí</Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
