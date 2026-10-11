'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Si es exitoso, el layout intercepta el cambio y redirige
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center mb-6">
          <img 
            src="/logo-rem.png" 
            alt="REM Industrial" 
            className="h-24 object-contain" 
          />
        </Link>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Iniciar Sesión
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-300">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Correo Electrónico</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 block w-full pl-11 sm:text-sm border-2 border-slate-300 hover:border-slate-400 rounded-lg py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors font-medium outline-none"
                  placeholder="correo@tuempresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Contraseña</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 block w-full pl-11 sm:text-sm border-2 border-slate-300 hover:border-slate-400 rounded-lg py-2.5 text-slate-900 placeholder:text-slate-400 transition-colors font-medium outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="mt-2 text-right">
                <Link href="/admin/recuperar-password" className="text-xs text-brand-600 hover:text-brand-800 font-semibold hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-red-700 text-sm bg-red-50 p-3.5 rounded-lg border border-red-200 font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400 transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ingresar'}
              </button>
            </div>
          </form>

          {/* Divisor y Botón Crear Cuenta */}
          <div className="mt-6 pt-6 border-t-2 border-slate-200">
            <p className="text-center text-xs text-slate-600 font-medium mb-3">
              ¿Aún no tienes cuenta para tu empresa?
            </p>
            <Link
              href="/registro"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border-2 border-brand-700 rounded-lg shadow-sm text-sm font-bold text-brand-700 bg-white hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              <UserPlus className="h-4 w-4 text-brand-700" />
              Crear Cuenta Empresarial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
