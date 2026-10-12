'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { supabase } from '@/lib/supabase/client';

export default function BannerCtaNosotros() {
  const DEFAULT_PHONE = '6141815170';
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState(DEFAULT_PHONE);
  const [nombreVendedor, setNombreVendedor] = useState<string | null>(null);

  useEffect(() => {
    async function resolverContacto() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: perfil } = await supabase
            .from('perfiles_clientes')
            .select('vendedor:vendedores(nombre, telefono, activo)')
            .eq('id', session.user.id)
            .single();

          if (perfil?.vendedor && (perfil.vendedor as any).activo !== false && (perfil.vendedor as any).telefono) {
            const vend = perfil.vendedor as any;
            const limpio = vend.telefono.replace(/\D/g, '');
            if (limpio) {
              setTelefonoWhatsApp(limpio);
              setNombreVendedor(vend.nombre);
              return;
            }
          }
        }
        
        // Si no hay login o el cliente no tiene vendedor asignado, se mantiene al 6141815170
        setTelefonoWhatsApp(DEFAULT_PHONE);
        setNombreVendedor(null);
      } catch (err) {
        console.error('Error resolviendo vendedor asignado en Banner:', err);
        setTelefonoWhatsApp(DEFAULT_PHONE);
        setNombreVendedor(null);
      }
    }

    resolverContacto();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) resolverContacto();
      else {
        setTelefonoWhatsApp(DEFAULT_PHONE);
        setNombreVendedor(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const textoWhatsApp = nombreVendedor
    ? `Hola ${nombreVendedor}, te contacto desde la página de REM Industrial para solicitar asesoría técnica.`
    : `Hola, me gustaría solicitar información técnica y cotizaciones de REM Industrial.`;

  const urlWhatsApp = `https://wa.me/52${telefonoWhatsApp}?text=${encodeURIComponent(textoWhatsApp)}`;

  return (
    <div className="mt-16 bg-gradient-to-r from-slate-900 via-brand-900/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <p className="text-white text-lg sm:text-xl md:text-2xl font-bold leading-relaxed sm:leading-normal tracking-tight">
          Explora nuestro catálogo en línea, cotiza en segundos con entrega inmediata en Cd. Juárez, El Paso TX, Chihuahua Capital o envíos a toda la República Mexicana.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/catalogo"
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 text-sm uppercase tracking-wider"
          >
            <span>Ir al Catálogo de Productos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm hover:border-emerald-500/50"
            title={nombreVendedor ? `Contactar a tu asesor: ${nombreVendedor}` : 'Contactar por WhatsApp'}
          >
            <WhatsAppIcon className="w-4 h-4 text-emerald-400 fill-current" />
            <span>Contacta por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
