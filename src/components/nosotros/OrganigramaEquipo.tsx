'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  Sparkles,
  RotateCcw,
  Network,
  Grid
} from 'lucide-react';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EQUIPO_INICIAL, MiembroEquipo } from '@/data/equipo';
import { supabase } from '@/lib/supabase/client';

const DEPARTAMENTOS: MiembroEquipo['departamento'][] = [
  'Dirección',
  'Ventas Técnicas',
  'Cotizaciones',
  'Logística y Operaciones',
];

export default function OrganigramaEquipo() {
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(EQUIPO_INICIAL);
  const [filtroDepto, setFiltroDepto] = useState<string>('Todos');
  const [vista, setVista] = useState<'organigrama' | 'grid'>('organigrama');
  
  // Modal de agregar / editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState<MiembroEquipo | null>(null);
  const [modoEdicionVisible, setModoEdicionVisible] = useState(false);
  
  // Formulario temporal
  const [formNombre, setFormNombre] = useState('');
  const [formPuesto, setFormPuesto] = useState('');
  const [formDepartamento, setFormDepartamento] = useState<MiembroEquipo['departamento']>('Ventas Técnicas');
  const [formNivel, setFormNivel] = useState<1 | 2 | 3>(2);
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Cargar desde localStorage y sincronizar vendedores de Supabase
  useEffect(() => {
    try {
      const guardado = localStorage.getItem('rem_equipo_organigrama');
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEquipo(parsed);
          return;
        }
      }
    } catch {
      // Ignorar error de parsing
    }

    // Si no hay local, buscar si hay vendedores registrados en Supabase para enriquecer
    async function sincronizarVendedores() {
      try {
        const { data: vends } = await supabase
          .from('vendedores')
          .select('id, nombre, email, telefono, foto_url, activo')
          .eq('activo', true);

        if (vends && vends.length > 0) {
          // Si encontramos vendedores en la DB, agregarlos armoniosamente
          const extras: MiembroEquipo[] = vends.map((v, i) => ({
            id: `vendedor-${v.id || i}`,
            nombre: v.nombre,
            puesto: 'Asesor Técnico de Ventas',
            departamento: 'Ventas Técnicas',
            nivelJerarquico: 2,
            foto_url: v.foto_url || '',
            telefono: v.telefono || '6566341516',
            email: v.email || 'ventasrem@remindustrial.mx',
            descripcion: 'Atención personalizada y asesoría técnica en herramientas de corte y equipo industrial.',
          }));

          // Mezclar sin duplicar nombres
          const base = [...EQUIPO_INICIAL];
          extras.forEach((nuevo) => {
            if (!base.some((b) => b.nombre.toLowerCase() === nuevo.nombre.toLowerCase())) {
              base.push(nuevo);
            }
          });
          setEquipo(base);
        }
      } catch (err) {
        console.error('Error sincronizando vendedores:', err);
      }
    }

    sincronizarVendedores();
  }, []);

  // Guardar en localStorage cada vez que cambie
  const guardarEquipo = (nuevoEquipo: MiembroEquipo[]) => {
    setEquipo(nuevoEquipo);
    try {
      localStorage.setItem('rem_equipo_organigrama', JSON.stringify(nuevoEquipo));
    } catch (e) {
      console.error('Error guardando equipo:', e);
    }
  };

  const abrirModalNuevo = () => {
    setMiembroEditando(null);
    setFormNombre('');
    setFormPuesto('');
    setFormDepartamento('Ventas Técnicas');
    setFormNivel(2);
    setFormTelefono('656');
    setFormEmail('ventasrem@remindustrial.mx');
    setFormFotoUrl('');
    setFormDescripcion('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (miembro: MiembroEquipo) => {
    setMiembroEditando(miembro);
    setFormNombre(miembro.nombre);
    setFormPuesto(miembro.puesto);
    setFormDepartamento(miembro.departamento);
    setFormNivel(miembro.nivelJerarquico);
    setFormTelefono(miembro.telefono || '');
    setFormEmail(miembro.email || '');
    setFormFotoUrl(miembro.foto_url || '');
    setFormDescripcion(miembro.descripcion || '');
    setModalAbierto(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Subir a Supabase Storage bucket 'media' si es posible, o convertir a DataURL
    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `equipo/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage.from('media').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        setFormFotoUrl(publicUrlData.publicUrl);
      } else {
        // Fallback a Base64 local
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormFotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarMiembro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formPuesto.trim()) return;

    if (miembroEditando) {
      // Editar
      const actualizado = equipo.map((m) =>
        m.id === miembroEditando.id
          ? {
              ...m,
              nombre: formNombre.trim(),
              puesto: formPuesto.trim(),
              departamento: formDepartamento,
              nivelJerarquico: formNivel,
              telefono: formTelefono.trim(),
              email: formEmail.trim(),
              foto_url: formFotoUrl.trim(),
              descripcion: formDescripcion.trim(),
            }
          : m
      );
      guardarEquipo(actualizado);
    } else {
      // Crear nuevo
      const nuevo: MiembroEquipo = {
        id: `miembro-${Date.now()}`,
        nombre: formNombre.trim(),
        puesto: formPuesto.trim(),
        departamento: formDepartamento,
        nivelJerarquico: formNivel,
        telefono: formTelefono.trim(),
        email: formEmail.trim(),
        foto_url: formFotoUrl.trim(),
        descripcion: formDescripcion.trim(),
      };
      guardarEquipo([...equipo, nuevo]);
    }

    setModalAbierto(false);
  };

  const eliminarMiembro = (id: string) => {
    if (confirm('¿Deseas retirar a este miembro del organigrama?')) {
      const filtrado = equipo.filter((m) => m.id !== id);
      guardarEquipo(filtrado);
    }
  };

  const restaurarOriginales = () => {
    if (confirm('¿Restaurar la lista original de miembros de REM Industrial?')) {
      guardarEquipo(EQUIPO_INICIAL);
    }
  };

  // Filtrado
  const equipoFiltrado = equipo.filter((m) => {
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
        className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 flex flex-col items-center text-center"
      >
        {/* Controles de edición en hover o si está activado el modo admin */}
        {modoEdicionVisible && (
          <div className="absolute top-3 right-3 flex items-center gap-1 z-10 bg-slate-900/90 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => abrirModalEditar(m)}
              className="p-1.5 hover:text-cyan-400 text-slate-400 transition-colors"
              title="Editar miembro"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => eliminarMiembro(m.id)}
              className="p-1.5 hover:text-red-400 text-slate-400 transition-colors"
              title="Eliminar miembro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
        <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
          {m.nombre}
        </h4>
        <p className="text-xs font-medium text-cyan-400 mb-3 tracking-wide">
          {m.puesto}
        </p>

        {/* Descripción */}
        {m.descripcion && (
          <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3 px-2">
            {m.descripcion}
          </p>
        )}

        {/* Botones de contacto directo */}
        <div className="mt-auto w-full pt-4 border-t border-slate-700/60 flex items-center justify-center gap-2">
          {telLimpio && (
            <a
              href={`https://wa.me/52${telLimpio}?text=Hola%20${encodeURIComponent(m.nombre)},%20te%20contacto%20desde%20la%20página%20de%20REM%20Industrial.`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
              title="Contactar por WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp</span>
            </a>
          )}
          {m.email && (
            <a
              href={`mailto:${m.email}?subject=Consulta%20Técnica%20-%20REM%20Industrial`}
              className="py-2 px-3 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/40 flex items-center justify-center text-xs font-semibold transition-all"
              title="Enviar correo electrónico"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Controles de cabecera: Filtros, Vista y Botón Agregar */}
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
            Todos ({equipo.length})
          </button>
          {DEPARTAMENTOS.map((dep) => {
            const total = equipo.filter((e) => e.departamento === dep).length;
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

        {/* Switchers de vista & administración */}
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

          <button
            onClick={() => setModoEdicionVisible(!modoEdicionVisible)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              modoEdicionVisible
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Activar/Desactivar edición de miembros"
          >
            {modoEdicionVisible ? 'Terminar Edición' : 'Editar Equipo'}
          </button>

          {modoEdicionVisible && (
            <>
              <button
                onClick={abrirModalNuevo}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
              <button
                onClick={restaurarOriginales}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
                title="Restaurar valores de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Renderizado Organigrama o Grid */}
      {vista === 'organigrama' && filtroDepto === 'Todos' ? (
        <div className="space-y-12 relative">
          {/* Nivel 1: Dirección & Liderazgo */}
          {nivel1.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-amber-500/50"></span>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                  Nivel 1 • Liderazgo & Dirección
                </span>
                <span className="h-px w-8 bg-amber-500/50"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl w-full justify-center">
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
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-cyan-500/50"></span>
                <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  Nivel 2 • Ventas Técnicas & Asesoría de Campo
                </span>
                <span className="h-px w-8 bg-cyan-500/50"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
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
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-emerald-500/50"></span>
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                  Nivel 3 • Cotizaciones, Soporte & Logística
                </span>
                <span className="h-px w-8 bg-emerald-500/50"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {nivel3.map(renderCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista Grid normal (cuando está filtrado o seleccionó Galería) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipoFiltrado.map(renderCard)}
        </div>
      )}

      {/* MODAL PARA AGREGAR O EDITAR MIEMBRO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">
                  {miembroEditando ? 'Editar Miembro del Equipo' : 'Agregar Nuevo Miembro'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarMiembro} className="space-y-4">
              {/* Foto Uploader */}
              <div className="flex flex-col items-center gap-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-900 border-2 border-cyan-500/40 flex items-center justify-center">
                  {formFotoUrl ? (
                    <img src={formFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{subiendoFoto ? 'Subiendo...' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubirFoto}
                      className="hidden"
                      disabled={subiendoFoto}
                    />
                  </label>
                  {formFotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormFotoUrl('')}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="O pega una URL de foto..."
                  value={formFotoUrl}
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-300 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {/* Nombre y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Puesto / Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Asesor Técnico de Ventas"
                    value={formPuesto}
                    onChange={(e) => setFormPuesto(e.target.value)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Departamento y Nivel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departamento
                  </label>
                  <select
                    value={formDepartamento}
                    onChange={(e) => setFormDepartamento(e.target.value as any)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nivel en Organigrama
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value={1}>Nivel 1 (Dirección / Gerencia)</option>
                    <option value={2}>Nivel 2 (Ventas / Asesoría)</option>
                    <option value={3}>Nivel 3 (Cotizaciones / Soporte)</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="6566341516"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ventasrem@remindustrial.mx"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Especialidad / Descripción breve
                </label>
                <textarea
                  rows={2}
                  placeholder="Especialista en herramientas de carburo, fresado y cuentas maquiladoras..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {miembroEditando ? 'Guardar Cambios' : 'Agregar al Organigrama'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
