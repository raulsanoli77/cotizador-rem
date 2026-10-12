'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

export default function Footer() {
  const year = new Date().getFullYear();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('REM Industrial');
  const [empresa, setEmpresa] = useState({ email: 'ventas3@remindustrial.mx', telefono: '614 181 5170' });
  const [vendedorAsignado, setVendedorAsignado] = useState<{ nombre: string; email: string; telefono: string } | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('configuracion').select('*');
      if (data) {
        data.forEach((item: any) => {
          if (item.clave === 'apariencia' && item.valor) {
            if (item.valor.logo_url) setLogoUrl(item.valor.logo_url);
            if (item.valor.titulo) setTitulo(item.valor.titulo);
          }
          if (item.clave === 'empresa' && item.valor) {
            setEmpresa({
              email: item.valor.email || 'ventas3@remindustrial.mx',
              telefono: item.valor.telefono || '614 181 5170',
            });
          }
        });
      }
    }

    async function checkSeller() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: perfil } = await supabase
          .from('perfiles_clientes')
          .select('vendedor:vendedores(nombre, telefono, email, activo)')
          .eq('id', session.user.id)
          .single();

        if (perfil?.vendedor && (perfil.vendedor as any).activo !== false) {
          setVendedorAsignado(perfil.vendedor as any);
        } else {
          setVendedorAsignado(null);
        }
      } else {
        setVendedorAsignado(null);
      }
    }

    fetchConfig();
    checkSeller();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkSeller();
      else setVendedorAsignado(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <footer className="bg-brand-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Empresa */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={titulo} className="h-10 object-contain brightness-0 invert" />
              ) : (
                <span>{titulo}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Proveedor industrial especializado en herramientas de corte, equipo de medición, herramental y suministros MRO para la industria metalmecánica y maquiladora.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/nosotros" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/cotizacion" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cotización
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              {vendedorAsignado ? `Asesor Asignado: ${vendedorAsignado.nombre}` : 'Contacto'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4 shrink-0" />
                <a 
                  href={`mailto:${vendedorAsignado?.email || empresa.email}`} 
                  className="hover:text-white transition-colors break-all"
                >
                  {vendedorAsignado?.email || empresa.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-emerald-400 fill-current" />
                <a 
                  href={`https://wa.me/52${(vendedorAsignado?.telefono || empresa.telefono).replace(/\D/g, '')}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  title="Abrir chat en WhatsApp"
                >
                  <span>{vendedorAsignado?.telefono || empresa.telefono}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs">
            © {year} {titulo}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
