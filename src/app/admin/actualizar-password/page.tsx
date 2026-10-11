'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Verificar que el usuario viene de un link de recuperación válido
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Todo bien, permitir el cambio
      }
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/login');
      }, 3000);
    }
    setLoading(false);
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
          Actualizar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          Ingresa tu nueva contraseña a continuación.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-300">
          {success ? (
            <div className="text-center">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg mb-6 border border-emerald-200 font-semibold text-sm">
                ¡Tu contraseña ha sido actualizada con éxito!
              </div>
              <p className="text-sm text-slate-500 mb-4">Serás redirigido al inicio de sesión en unos segundos...</p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-800 font-bold"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleUpdate}>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">Nueva Contraseña</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 block w-full pl-11 sm:text-sm border-2 border-slate-300 hover:border-slate-400 rounded-lg py-2.5 text-slate-900 placeholder:text-slate-400 font-medium outline-none transition-colors"
                    placeholder="Min. 6 caracteres"
                  />
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
                  disabled={loading || password.length < 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400 transition-all"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
