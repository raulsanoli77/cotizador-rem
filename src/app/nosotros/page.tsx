import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OrganigramaEquipo from '@/components/nosotros/OrganigramaEquipo';
import BannerCtaNosotros from '@/components/nosotros/BannerCtaNosotros';
import { createServerClient } from '@/lib/supabase/server';
import { 
  NOSOTROS_CONFIG_DEFAULT, 
  RECUADROS_HERO_DEFAULT,
  EQUIPO_INICIAL, 
  NosotrosConfig, 
  MiembroEquipo,
  normalizarNosotrosConfig
} from '@/data/equipo';
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
  Building2,
  Globe,
  Truck
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | REM Industrial',
  description: 'Conoce a REM Industrial: Tú Socio Industrial en herramientas de corte, medición y maquinado en Ciudad Juárez, El Paso TX, Chihuahua y toda la República Mexicana.',
};

export default async function SobreNosotrosPage() {
  const supabase = createServerClient();

  let config: NosotrosConfig = NOSOTROS_CONFIG_DEFAULT;
  let equipo: MiembroEquipo[] = EQUIPO_INICIAL;

  try {
    const { data } = await supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['nosotros_pagina', 'nosotros_equipo']);

    if (data) {
      data.forEach((item) => {
        if (item.clave === 'nosotros_pagina' && item.valor) {
          config = normalizarNosotrosConfig(item.valor);
        }
        if (item.clave === 'nosotros_equipo' && Array.isArray(item.valor)) {
          equipo = item.valor;
        }
      });
    }
  } catch (err) {
    console.error('Error cargando configuración pública de nosotros:', err);
  }

  return (
    <div className="min-h-screen flex flex-col pt-24 bg-slate-900 text-slate-100">
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
          
          <div className="container mx-auto max-w-6xl px-4 relative z-10 text-center">
            {/* Badge: Tú Socio Industrial */}
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-6 shadow-xs">
              <Building2 className="w-4 h-4" />
              {config.badge || 'Tú Socio Industrial'}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase max-w-4xl mx-auto leading-tight mb-6">
              {config.titulo_hero}
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-4xl mx-auto font-medium leading-relaxed mb-8">
              {config.subtitulo_hero}
            </p>

            {/* Badges de Cobertura y Fortalezas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4">
              {(config.recuadros_hero || RECUADROS_HERO_DEFAULT).map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 text-center backdrop-blur-sm flex flex-col justify-center min-h-[96px]"
                >
                  <span className="block text-xl sm:text-2xl font-black text-cyan-400 tracking-tight leading-tight mb-1">
                    {r.destacado}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-medium leading-snug block">
                    {r.subtitulo}
                  </span>
                </div>
              ))}
            </div>

            {/* Franja de presencia y expansión */}
            <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm font-medium text-slate-200">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{config.presencia_ciudades}</span>
            </div>
          </div>
        </section>

        {/* SECCIÓN ACERCA DE NOSOTROS + FOTO DEL EQUIPO */}
        <section className="py-12 md:py-16 px-4 bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              
              {/* Foto oficial del equipo */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 group h-full min-h-[340px] max-h-[480px] flex items-center">
                  <img
                    src={config.foto_principal_url || '/images/equipo-rem.jpg'}
                    alt="Equipo REM Industrial"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Texto corporativo, Misión y Visión */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-center pt-2 lg:pt-0">
                <div>
                  <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-cyan-400 mb-1.5 block">
                    Nuestra Identidad
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                    Compromiso con el Éxito de tus Operaciones
                  </h2>
                </div>

                <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic border-l-4 border-cyan-500 pl-4 py-1 font-normal">
                  {config.texto_nosotros}
                </p>

                {/* Tarjetas Misión & Visión en 2 columnas equilibradas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Visión */}
                  <div className="bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Eye className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">
                          Visión
                        </h3>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {config.vision}
                      </p>
                    </div>
                  </div>

                  {/* Misión */}
                  <div className="bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Target className="w-4 h-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">
                          Misión
                        </h3>
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {config.mision}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* PILARES Y VALORES */}
        <section className="py-12 md:py-16 px-4 bg-slate-950/80 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
                Por Qué Elegirnos
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Pilares de Valor Industrial
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(config.pilares || []).map((pilar) => {
                const getIcon = (ico?: string) => {
                  switch (ico) {
                    case 'zap': return <Zap className="w-6 h-6" />;
                    case 'wrench': return <Wrench className="w-6 h-6" />;
                    case 'truck': return <Truck className="w-6 h-6" />;
                    case 'shield':
                    default: return <ShieldCheck className="w-6 h-6" />;
                  }
                };
                return (
                  <div key={pilar.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                      {getIcon(pilar.icono)}
                    </div>
                    <h4 className="text-lg font-extrabold text-white mb-2.5">{pilar.titulo}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-normal">
                      {pilar.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ORGANIGRAMA Y EQUIPO (100% LIMPIO Y DE SOLO LECTURA PARA CLIENTES) */}
        <section className="py-12 md:py-16 px-4 bg-slate-900 border-b border-slate-800">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
                Estructura Organizacional
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                Nuestro Equipo de Trabajo
              </h2>
              <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-3xl mx-auto font-medium leading-relaxed">
                Especialistas técnicos, asesores de aplicaciones y personal operativo enfocados en maximizar la productividad de tu planta.
              </p>
            </div>

            <OrganigramaEquipo miembros={equipo} />
          </div>
        </section>

        {/* PRESENCIA GEOGRÁFICA, SUCURSALES Y CONTACTO */}
        <section className="py-12 md:py-16 px-4 bg-slate-950">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
                Presencia Binacional & Envíos Nacionales
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Nuestras Instalaciones y Medios de Contacto
              </h2>
              <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-3xl mx-auto font-medium leading-relaxed">
                {config.presencia_ciudades}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* COLUMNA IZQUIERDA: MAPA INTERACTIVO + TELÉFONOS + HORARIO */}
              <div className="lg:col-span-6 space-y-4">
                {/* Mapa de Google */}
                <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[310px] bg-slate-900">
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

                {/* TELÉFONOS CON TÍTULO PERSONALIZADO (APROVECHA EL ESPACIO BAJO EL MAPA) */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Líneas Telefónicas</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.telefonos.map((t) => {
                      const numLimpio = t.numero.replace(/\D/g, '');
                      return (
                        <div key={t.id} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                          <span className="block text-xs font-semibold text-slate-400">
                            {t.titulo}
                          </span>
                          <a
                            href={`tel:${numLimpio}`}
                            className="text-base font-bold text-white hover:text-cyan-300 transition-colors block mt-0.5"
                          >
                            {t.numero}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HORARIO DE ATENCIÓN */}
                {config.horario && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Horario de Atención
                      </span>
                      <p className="text-sm sm:text-base font-semibold text-white mt-0.5">
                        {config.horario}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: SEDES / SUCURSALES + CORREOS OFICIALES */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* MÚLTIPLES DIRECCIONES / SUCURSALES */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Sedes & Sucursales</span>
                  </h4>
                  {config.direcciones.map((dir) => (
                    <div
                      key={dir.id}
                      className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                          {dir.titulo}
                        </h5>
                        <p className="text-base font-semibold text-white leading-relaxed mt-0.5">
                          {dir.direccion}
                        </p>
                        {dir.detalles && (
                          <p className="text-sm text-slate-300 mt-1">
                            {dir.detalles}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CORREOS ELECTRÓNICOS */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Correos Oficiales</span>
                  </h4>
                  <div className="space-y-2">
                    {config.emails.map((e) => (
                      <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-800/60 px-3.5 py-2.5 rounded-xl border border-slate-700/60">
                        <span className="text-sm font-semibold text-slate-300">
                          {e.titulo}:
                        </span>
                        <a
                          href={`mailto:${e.email}`}
                          className="text-sm sm:text-base font-bold text-cyan-400 hover:underline break-all"
                        >
                          {e.email}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* BANNER CTA */}
            <BannerCtaNosotros />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
