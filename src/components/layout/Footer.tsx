import Link from 'next/link';
import { Wrench, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Empresa */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <Wrench className="h-6 w-6 text-brand-400" />
              <span>REM <span className="text-brand-400">Industrial</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Integrador t\u00e9cnico de herramientas industriales para talleres de
              maquinado y maquiladoras.
            </p>
          </div>

          {/* Enlaces */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cat\u00e1logo
                </Link>
              </li>
              <li>
                <Link href="/cotizacion" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cotizaci\u00f3n
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
                <span>ventas@remindustrial.com</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4" />
                <span>+52 (81) 0000-0000</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs">
            \u00a9 {year} REM Industrial. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
