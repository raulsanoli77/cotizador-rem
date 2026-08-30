'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function Footer() {
  const year = new Date().getFullYear();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('REM Industrial');
  const [empresa, setEmpresa] = useState({ email: '', telefono: '' });

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
              email: item.valor.email || 'ventas@remindustrial.com',
              telefono: item.valor.telefono || '+52 (81) 0000-0000',
            });
          }
        });
      }
    }
    fetchConfig();
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
              Integrador técnico de herramientas industriales para talleres de
              maquinado y maquiladoras.
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
                <Link href="/cotizacion" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cotización
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4" />
                <span>{empresa.email}</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4" />
                <span>{empresa.telefono}</span>
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
