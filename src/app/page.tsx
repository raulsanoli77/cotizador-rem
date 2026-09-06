import Link from 'next/link';
import { Search, FileText, Settings, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { createServerClient } from '@/lib/supabase/server';

// Server Component
export default async function Home() {
  const supabase = createServerClient();
  const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'apariencia').single();
  const logoUrl = data?.valor?.logo_url;
  const titulo = data?.valor?.titulo || 'REM Industrial';

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-slate-900">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section (GWS Style - Dark & Technical) */}
        <section className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
          {/* Video Background with Noise-Reduction Filters */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-30 grayscale blur-[2px] scale-[1.35] origin-center"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          
          {/* Patrón de puntos para enmascarar la compresión del video (dithering) */}
          <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          
          {/* Capas oscuras para asegurar que el texto sea legible y se funda con el azul oscuro */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-0"></div>
          
          <div className="relative container mx-auto max-w-6xl px-4 py-24 md:py-32 flex flex-col md:flex-row items-center justify-between gap-12 z-10">
            
            <div className="flex-1 text-center md:text-left z-10">
              {/* Logo Gigante */}
              <div className="inline-block bg-white p-6 rounded-2xl shadow-2xl mb-8 mx-auto md:mx-0 relative">
                <img 
                  src={logoUrl || '/logo-rem.png'} 
                  alt={titulo} 
                  className="h-24 md:h-32 object-contain relative z-10" 
                />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white tracking-tight leading-tight relative drop-shadow-lg">
                PROVEEDOR INDUSTRIAL <span className="text-brand-500">ESPECIALIZADO</span>
              </h2>
              <p className="text-lg md:text-xl mb-10 text-slate-300 font-medium max-w-2xl mx-auto md:mx-0 leading-relaxed drop-shadow-md">
                Herramientas de corte, equipo de medición, herramental y suministros MRO para la <strong className="text-white">industria metalmecánica y maquiladora</strong>. Catálogo avanzado con cotización instantánea.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link 
                  href="/catalogo" 
                  className="w-full sm:w-auto bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 px-8 rounded-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 backdrop-blur-sm"
                >
                  Ir al Catálogo <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/cotizacion" 
                  className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md text-white border border-slate-600 font-bold py-4 px-8 rounded-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Cotización Rápida
                </Link>
              </div>
            </div>

            {/* Espacio vacío a la derecha para no tapar el modelo 3D del video */}
            <div className="hidden lg:flex flex-1 justify-end z-10">
            </div>
          </div>
        </section>
        
        {/* Features Section (Dark Technical Look) */}
        <section className="py-24 px-4 bg-slate-900">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-800 pt-16">
              
              <div className="group p-8 border border-slate-800 bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <Search className="h-10 w-10 text-brand-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">Búsqueda Técnica</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Filtra exactamente lo que necesitas por diámetro, recubrimiento, filos y marca. Precisión en cada click.
                </p>
              </div>
              
              <div className="group p-8 border border-slate-800 bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <FileText className="h-10 w-10 text-brand-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">Cotización en PDF</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Generación de documentos formales automatizados con precios actualizados al instante, sin tiempos de espera.
                </p>
              </div>
              
              <div className="group p-8 border border-slate-800 bg-slate-800/30 hover:bg-slate-800/60 transition-colors">
                <Settings className="h-10 w-10 text-brand-500 mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-wide">Desempeño B2B</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Solicita cotizaciones formales al equipo de ingeniería con tiempos de entrega precisos para tu línea de producción.
                </p>
              </div>
              
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
