'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const redirectUrl = `${window.location.origin}/admin/actualizar-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center mb-6">
          <img 
            src="/logo-rem.png" 
            alt="REM Industrial" 
            className="h-24 object-contain" 
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recuperar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingresa tu correo para recibir un enlace de recuperación.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {success ? (
            <div className="text-center">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-6 border border-emerald-100">
                Si tu correo está registrado, recibirás un enlace para actualizar tu contraseña en breve.
              </div>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-500 font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRecuperar}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar enlace'}
                </button>
              </div>

              <div className="text-center mt-4">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
