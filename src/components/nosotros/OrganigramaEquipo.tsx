'use client';

import { useState } from 'react';
import { 
  Users, 
  Mail, 
  Phone,
  Check, 
  Network,
  Grid
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EQUIPO_INICIAL, MiembroEquipo } from '@/data/equipo';

const DEPARTAMENTOS: MiembroEquipo['departamento'][] = [
  'Dirección',
  'Ventas Técnicas',
  'Cotizaciones',
  'Logística y Operaciones',
];

interface OrganigramaEquipoProps {
  miembros?: MiembroEquipo[];
}

export default function OrganigramaEquipo({ miembros = EQUIPO_INICIAL }: OrganigramaEquipoProps) {
  const [filtroDepto, setFiltroDepto] = useState<string>('Todos');
  const [vista, setVista] = useState<'organigrama' | 'grid'>('organigrama');

  // Filtrado
  const equipoFiltrado = miembros.filter((m) => {
    if (filtroDepto === 'Todos') return true;
    return m.departamento === filtroDepto;
  });

  // Agrupado por nivel para vista organigrama
  const nivel1 = equipoFiltrado.filter((m) => m.nivelJerarquico === 1);
  const nivel2 = equipoFiltrado.filter((m) => m.nivelJerarquico === 2);
  const nivel3 = equipoFiltrado.filter((m) => m.nivelJerarquico === 3);

  // Badge de color por departamento
  const getColorDepto = (dep: string) => {
    switch (dep) {
      case 'Dirección':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Ventas Técnicas':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Cotizaciones':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Logística y Operaciones':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const renderCard = (m: MiembroEquipo) => {
    const telLimpio = (m.telefono || '').replace(/\D/g, '');
    const iniciales = m.nombre
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <div
        key={m.id}
        className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 flex flex-col items-center text-center w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm"
      >
        {/* Foto / Avatar */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/40 group-hover:border-cyan-400 shadow-lg group-hover:scale-105 transition-all bg-slate-900 flex items-center justify-center">
            {m.foto_url ? (
              <img
                src={m.foto_url}
                alt={m.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-cyan-400">
                <span className="font-bold text-xl">{iniciales || 'REM'}</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Activo">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Departamento Badge */}
        <span
          className={`inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border mb-2 ${getColorDepto(
            m.departamento
          )}`}
        >
          {m.departamento}
        </span>

        {/* Nombre y Puesto */}
        <h4 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors leading-snug">
          {m.nombre}
        </h4>
        <p className="text-xs sm:text-sm font-semibold text-cyan-400 mb-3 tracking-wide">
          {m.puesto}
        </p>

        {/* Descripción */}
        {m.descripcion && (
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3 line-clamp-3 px-2">
            {m.descripcion}
          </p>
        )}

        {/* Contenedor de contacto y acciones */}
        {((m.telefono && m.mostrarTelefono !== false) ||
          (m.email && m.mostrarEmail !== false) ||
          (telLimpio && m.mostrarBotonWhatsapp !== false) ||
          (m.email && m.mostrarBotonEmail !== false)) && (
          <div className="w-full mt-auto pt-3 border-t border-slate-700/60 space-y-3">
            {/* Teléfono y Correo en texto */}
            {((m.telefono && m.mostrarTelefono !== false) || (m.email && m.mostrarEmail !== false)) && (
              <div className="space-y-1.5 text-left">
                {m.telefono && m.mostrarTelefono !== false && (
                  <a
                    href={`tel:${telLimpio}`}
                    className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition-colors group/tel font-mono text-xs sm:text-sm font-medium"
                    title="Llamar"
                  >
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{m.telefono}</span>
                  </a>
                )}
                {m.email && m.mostrarEmail !== false && (
                  <a
                    href={`mailto:${m.email}?subject=Consulta%20Técnica%20-%20REM%20Industrial`}
                    className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition-colors group/mail text-xs sm:text-sm font-medium"
                    title="Enviar correo"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate break-all">{m.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Botones de acción */}
            {((telLimpio && m.mostrarBotonWhatsapp !== false) || (m.email && m.mostrarBotonEmail !== false)) && (
              <div className={`flex items-center justify-center gap-2 ${((m.telefono && m.mostrarTelefono !== false) || (m.email && m.mostrarEmail !== false)) ? 'pt-2.5 border-t border-slate-700/40' : ''}`}>
                {telLimpio && m.mostrarBotonWhatsapp !== false && (
                  <a
                    href={`https://wa.me/52${telLimpio}?text=Hola%20${encodeURIComponent(m.nombre)},%20te%20contacto%20desde%20la%20página%20de%20REM%20Industrial.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold transition-all"
                    title="Contactar por WhatsApp"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {m.email && m.mostrarBotonEmail !== false && (
                  <a
                    href={`mailto:${m.email}?subject=Consulta%20Técnica%20-%20REM%20Industrial`}
                    className="py-2.5 px-3.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/40 flex items-center justify-center text-xs sm:text-sm font-semibold transition-all"
                    title="Enviar correo electrónico"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Controles de cabecera: Filtros y Vista (completamente limpios para clientes) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
        {/* Filtros por departamento */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFiltroDepto('Todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroDepto === 'Todos'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Todos ({miembros.length})
          </button>
          {DEPARTAMENTOS.map((dep) => {
            const total = miembros.filter((e) => e.departamento === dep).length;
            return (
              <button
                key={dep}
                onClick={() => setFiltroDepto(dep)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filtroDepto === dep
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {dep} {total > 0 && `(${total})`}
              </button>
            );
          })}
        </div>

        {/* Switchers de vista */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-slate-800 rounded-xl p-1 flex items-center border border-slate-700">
            <button
              onClick={() => setVista('organigrama')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                vista === 'organigrama'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Organigrama"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Organigrama</span>
            </button>
            <button
              onClick={() => setVista('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                vista === 'grid'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista Galería"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Galería</span>
            </button>
          </div>
        </div>
      </div>

      {/* Renderizado Organigrama o Grid */}
      {vista === 'organigrama' && filtroDepto === 'Todos' ? (
        <div className="space-y-12 relative">
          {/* Nivel 1: Dirección & Liderazgo */}
          {nivel1.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-0.5 w-12 sm:w-16 bg-amber-500/50"></span>
                <span className="text-sm sm:text-base font-extrabold text-amber-400 tracking-wider uppercase">
                  Nivel 1 • Liderazgo & Dirección
                </span>
                <span className="h-0.5 w-12 sm:w-16 bg-amber-500/50"></span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 w-full">
                {nivel1.map(renderCard)}
              </div>
            </div>
          )}

          {/* Línea conectora visual */}
          {nivel1.length > 0 && (nivel2.length > 0 || nivel3.length > 0) && (
            <div className="flex justify-center -my-6">
              <div className="w-0.5 h-12 bg-gradient-to-b from-amber-500/50 via-cyan-500/50 to-cyan-500/50"></div>
            </div>
          )}

          {/* Nivel 2: Ventas Técnicas & Asesoría Especializada */}
          {nivel2.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-0.5 w-12 sm:w-16 bg-cyan-500/50"></span>
                <span className="text-sm sm:text-base font-extrabold text-cyan-400 tracking-wider uppercase">
                  Nivel 2 • Ventas Técnicas & Asesoría de Campo
                </span>
                <span className="h-0.5 w-12 sm:w-16 bg-cyan-500/50"></span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 w-full">
                {nivel2.map(renderCard)}
              </div>
            </div>
          )}

          {/* Línea conectora visual */}
          {nivel2.length > 0 && nivel3.length > 0 && (
            <div className="flex justify-center -my-6">
              <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-500/50 via-emerald-500/50 to-emerald-500/50"></div>
            </div>
          )}

          {/* Nivel 3: Cotizaciones, Logística y Soporte */}
          {nivel3.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-0.5 w-12 sm:w-16 bg-emerald-500/50"></span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 tracking-wider uppercase">
                  Nivel 3 • Cotizaciones, Soporte & Logística
                </span>
                <span className="h-0.5 w-12 sm:w-16 bg-emerald-500/50"></span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 w-full">
                {nivel3.map(renderCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista Grid normal */
        <div className="flex flex-wrap justify-center gap-6 w-full">
          {equipoFiltrado.map(renderCard)}
        </div>
      )}
    </div>
  );
}
