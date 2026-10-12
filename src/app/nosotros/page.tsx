import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OrganigramaEquipo from '@/components/nosotros/OrganigramaEquipo';
import { 
  Target, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Wrench, 
  ArrowRight,
  Building2
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | REM Industrial',
  description: 'Conoce a REM Industrial: distribuidor líder en herramientas de corte, equipo de medición, sujeción y suministros industriales en Ciudad Juárez, Chihuahua.',
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen flex flex-col pt-24 bg-slate-900 text-slate-100">
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
          
          <div className="container mx-auto max-w-6xl px-4 relative z-10 text-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Building2 className="w-4 h-4" />
              Socio Industrial en Ciudad Juárez
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight mb-6">
              Pasión por la Precisión y el <span className="text-cyan-400">Servicio Industrial</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed mb-8">
              En <strong className="text-white">REM Industrial</strong> proveemos soluciones técnicas de alto rendimiento en herramientas de corte, metrología, abrasivos y suministros MRO para la industria metalmecánica y maquiladora.
            </p>

            {/* Badges Rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className="block text-2xl sm:text-3xl font-black text-cyan-400">+15</span>
                <span className="text-xs text-slate-400 font-medium">Marcas Líderes Globales</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className="block text-2xl sm:text-3xl font-black text-cyan-400">100%</span>
                <span className="text-xs text-slate-400 font-medium">Cobertura en Cd. Juárez</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className="block text-2xl sm:text-3xl font-black text-cyan-400">Inmediato</span>
                <span className="text-xs text-slate-400 font-medium">Cotizaciones Digitales</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center backdrop-blur-sm">
                <span className="block text-2xl sm:text-3xl font-black text-cyan-400">Técnico</span>
                <span className="text-xs text-slate-400 font-medium">Soporte Especializado</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN ACERCA DE NOSOTROS + FOTO DEL EQUIPO */}
        <section className="py-20 px-4 bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Foto oficial con tarjeta flotante (como en el sitio oficial) */}
              <div className="lg:col-span-7 relative">
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 group">
                  <img
                    src="/images/equipo-rem.jpg"
                    alt="Equipo REM Industrial"
                    className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                </div>

                {/* Tarjeta flotante de contacto directo */}
                <div className="mt-4 sm:mt-0 sm:absolute sm:-bottom-6 sm:left-6 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    Contáctanos Directo
                  </h4>
                  <div className="space-y-1">
                    <a
                      href="tel:6566341516"
                      className="block text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors"
                    >
                      (656) 634 1516
                    </a>
                    <a
                      href="tel:6566341571"
                      className="block text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors"
                    >
                      (656) 634 1571
                    </a>
                  </div>
                </div>
              </div>

              {/* Texto corporativo, Misión y Visión */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 block">
                    Nuestra Identidad
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    Compromiso con el Éxito de tus Operaciones
                  </h2>
                </div>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
                  En <strong className="text-white">REM Industrial</strong>, nos comprometemos a ser el socio preferido y más confiable para la provisión de productos y servicios diseñados para optimizar la productividad y calidad de nuestros clientes, todo ello al costo más competitivo. Nuestra visión es ser reconocidos como la opción predilecta por nuestra capacidad de aportar soluciones efectivas y accesibles.
                </p>

                {/* Tarjetas Misión & Visión */}
                <div className="space-y-4 pt-2">
                  {/* Visión */}
                  <div className="bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Eye className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        Visión
                      </h3>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Ser el recurso preferido y el más confiable para los productos y servicios que mejoren y faciliten la productividad y calidad de nuestros clientes al menor costo posible.
                    </p>
                  </div>

                  {/* Misión */}
                  <div className="bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 rounded-2xl p-5 transition-all shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Target className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                        Misión
                      </h3>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Ser la empresa líder en la distribución de productos de calidad y servicios de gran valor, cuando y donde los necesite el cliente, creando relaciones positivas y duraderas con nuestros clientes.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* PILARES Y VALORES */}
        <section className="py-16 px-4 bg-slate-950/80 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 block">
                Por Qué Elegirnos
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Pilares de Valor Industrial
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Calidad Certificada</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Marcas originales de prestigio mundial con especificaciones técnicas rigurosas para la industria maquiladora.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Respuesta Inmediata</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cotizaciones formales y seguimiento ágil en WhatsApp y correo para que tus líneas de producción nunca se detengan.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Asesoría de Campo</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingenieros de aplicaciones que acuden a tu planta a optimizar parámetros de maquinado y selección de herramental.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Alianzas Duraderas</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Convenios comerciales, precios por volumen y esquemas de crédito adaptados a los requerimientos de tu empresa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ORGANIGRAMA Y EQUIPO */}
        <section className="py-20 px-4 bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 block">
                Estructura Organizacional
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Nuestro Equipo de Trabajo
              </h2>
              <p className="text-sm text-slate-400 mt-3">
                Profesionales especializados comprometidos con brindarte la mejor atención y asesoría técnica en cada proyecto.
              </p>
            </div>

            {/* Componente Interactivo de Organigrama */}
            <OrganigramaEquipo />
          </div>
        </section>

        {/* UBICACIÓN Y MEDIOS DE CONTACTO (CIUDAD JUÁREZ) */}
        <section className="py-20 px-4 bg-slate-950">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 block">
                Instalaciones en Ciudad Juárez
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Visítanos o Contáctanos
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Estamos estratégicamente ubicados en el corazón industrial de Ciudad Juárez, Chihuahua.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Mapa de Google */}
              <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[380px] bg-slate-900">
                <iframe
                  title="Ubicación REM Industrial Ciudad Juárez"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3395.7851862421567!2d-106.3649875!3d31.667096299999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86e75d415bc9e1a5%3A0xbb84ce7aa4611460!2sBlvd.%20Manuel%20G%C3%B3mez%20Mor%C3%ADn%201249%2C%20Las%20Palmas%2C%2032330%20Ju%C3%A1rez%2C%20Chih.!5e0!3m2!1ses-419!2smx!4v1717351876684!5m2!1ses-419!2smx"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              {/* Tarjetas de Información de Contacto */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Dirección
                    </h4>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      Av. Manuel Gómez Morín 1249, Colonia Las Palmas, Local 5, C.P. 32668 Ciudad Juárez, Chihuahua, México
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Teléfonos de Oficina
                    </h4>
                    <p className="text-sm font-bold text-white">
                      (656) 634 1516 &bull; (656) 634 1571
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Correo Electrónico
                    </h4>
                    <a
                      href="mailto:ventasrem@remindustrial.mx"
                      className="text-sm font-bold text-cyan-400 hover:underline"
                    >
                      ventasrem@remindustrial.mx
                    </a>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Horario de Atención
                    </h4>
                    <p className="text-sm font-semibold text-white">
                      Lunes a Viernes: 08:00 AM - 05:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BANNER CTA */}
            <div className="mt-16 bg-gradient-to-r from-slate-900 via-brand-900/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  ¿Listo para equipar tu planta con las mejores herramientas?
                </h3>
                <p className="text-slate-300 text-sm sm:text-base">
                  Explora nuestro catálogo en línea, selecciona tus medidas exactas y descarga o solicita tu cotización formal al instante.
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
                    href="https://wa.me/526566341516?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20asesor%C3%ADa%20técnica%20de%20REM%20Industrial."
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-sm"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>Hablar por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
