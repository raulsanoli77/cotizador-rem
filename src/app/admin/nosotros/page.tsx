'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Building2, 
  Users, 
  Save, 
  Loader2, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Upload, 
  Check, 
  X, 
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import { 
  NosotrosConfig, 
  NOSOTROS_CONFIG_DEFAULT, 
  MiembroEquipo, 
  EQUIPO_INICIAL 
} from '@/data/equipo';

const DEPARTAMENTOS: MiembroEquipo['departamento'][] = [
  'Dirección',
  'Ventas Técnicas',
  'Cotizaciones',
  'Logística y Operaciones',
];

export default function AdminNosotrosPage() {
  const [tabActiva, setTabActiva] = useState<'contenido' | 'equipo'>('contenido');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  // Estados del contenido general
  const [config, setConfig] = useState<NosotrosConfig>(NOSOTROS_CONFIG_DEFAULT);

  // Estados del organigrama
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(EQUIPO_INICIAL);
  
  // Modal de miembro
  const [modalAbierto, setModalAbierto] = useState(false);
  const [miembroEditando, setMiembroEditando] = useState<MiembroEquipo | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formPuesto, setFormPuesto] = useState('');
  const [formDepartamento, setFormDepartamento] = useState<MiembroEquipo['departamento']>('Ventas Técnicas');
  const [formNivel, setFormNivel] = useState<1 | 2 | 3>(2);
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFotoUrl, setFormFotoUrl] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Cargar datos de Supabase
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('configuracion')
          .select('clave, valor')
          .in('clave', ['nosotros_pagina', 'nosotros_equipo']);

        if (!error && data) {
          data.forEach((item) => {
            if (item.clave === 'nosotros_pagina' && item.valor) {
              setConfig({ ...NOSOTROS_CONFIG_DEFAULT, ...item.valor });
            }
            if (item.clave === 'nosotros_equipo' && Array.isArray(item.valor)) {
              setEquipo(item.valor);
            }
          });
        }
      } catch (err) {
        console.error('Error cargando configuración de Nosotros:', err);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  // Guardar en Supabase
  const handleGuardarContenido = async () => {
    try {
      setSaving(true);
      setMensaje(null);

      const { error } = await supabase.from('configuracion').upsert(
        [
          { clave: 'nosotros_pagina', valor: config },
        ],
        { onConflict: 'clave' }
      );

      if (error) throw error;

      setMensaje({ texto: '¡Contenido de Sobre Nosotros guardado con éxito!', tipo: 'success' });
      setTimeout(() => setMensaje(null), 3500);
    } catch (err: any) {
      setMensaje({ texto: `Error al guardar: ${err.message || 'Error desconocido'}`, tipo: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarEquipo = async (nuevoEquipo: MiembroEquipo[]) => {
    try {
      setSaving(true);
      setMensaje(null);

      const { error } = await supabase.from('configuracion').upsert(
        [
          { clave: 'nosotros_equipo', valor: nuevoEquipo },
        ],
        { onConflict: 'clave' }
      );

      if (error) throw error;

      setEquipo(nuevoEquipo);
      setMensaje({ texto: '¡Organigrama del equipo guardado con éxito!', tipo: 'success' });
      setTimeout(() => setMensaje(null), 3500);
    } catch (err: any) {
      setMensaje({ texto: `Error al guardar organigrama: ${err.message || 'Error desconocido'}`, tipo: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Manejo del modal de miembros
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

  const guardarMiembroForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formPuesto.trim()) return;

    let nuevoEquipo: MiembroEquipo[];
    if (miembroEditando) {
      nuevoEquipo = equipo.map((m) =>
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
    } else {
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
      nuevoEquipo = [...equipo, nuevo];
    }

    setModalAbierto(false);
    await handleGuardarEquipo(nuevoEquipo);
  };

  const eliminarMiembro = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este miembro del organigrama?')) {
      const nuevoEquipo = equipo.filter((m) => m.id !== id);
      await handleGuardarEquipo(nuevoEquipo);
    }
  };

  const restaurarEquipoDefaults = async () => {
    if (confirm('¿Deseas restaurar la lista de miembros al estado inicial de fábrica?')) {
      await handleGuardarEquipo(EQUIPO_INICIAL);
    }
  };

  const handleSubirFotoMiembro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `equipo/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage.from('media').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(fileName);
        setFormFotoUrl(publicUrlData.publicUrl);
      }
    } catch (err) {
      console.error('Error subiendo foto:', err);
    } finally {
      setSubiendoFoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Administración de &quot;Sobre Nosotros&quot;
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona la información institucional, fotos oficiales y el organigrama del equipo de REM Industrial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/nosotros"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs transition-colors"
          >
            <span>Ver Página en Vivo</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Alerta de feedback */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between animate-fade-in ${
            mensaje.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setTabActiva('contenido')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            tabActiva === 'contenido'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Contenido General & Fotos</span>
        </button>

        <button
          onClick={() => setTabActiva('equipo')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            tabActiva === 'equipo'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Organigrama & Equipo ({equipo.length})</span>
        </button>
      </div>

      {/* TAB 1: CONTENIDO GENERAL & FOTOS */}
      {tabActiva === 'contenido' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
              Encabezado Hero & Alcance de la Empresa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insignia / Badge */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Insignia / Badge Superior
                </label>
                <input
                  type="text"
                  value={config.badge}
                  onChange={(e) => setConfig({ ...config, badge: e.target.value })}
                  placeholder="Tú Socio Industrial"
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500 font-semibold"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ejemplo: &quot;Tú Socio Industrial&quot;
                </p>
              </div>

              {/* Título Principal Hero */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Título Hero
                </label>
                <input
                  type="text"
                  value={config.titulo_hero}
                  onChange={(e) => setConfig({ ...config, titulo_hero: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Subtítulo Hero */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subtítulo Hero
                </label>
                <textarea
                  rows={2}
                  value={config.subtitulo_hero}
                  onChange={(e) => setConfig({ ...config, subtitulo_hero: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Presencia de Ciudades y Cobertura */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Presencia Geográfica y Expansión
                </label>
                <input
                  type="text"
                  value={config.presencia_ciudades}
                  onChange={(e) => setConfig({ ...config, presencia_ciudades: e.target.value })}
                  placeholder="Ciudad Juárez • El Paso TX • Próxima apertura Chihuahua Capital • Envíos a todo México"
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Destaca la presencia binacional y la apertura de nuevas plazas.
                </p>
              </div>
            </div>
          </div>

          {/* FOTO PRINCIPAL DEL EQUIPO */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
              Fotografía Oficial del Equipo (Sección Acerca de Nosotros)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subir Nueva Fotografía
                </label>
                <ImageUploader
                  bucket="media"
                  folder="nosotros"
                  currentUrl={config.foto_principal_url}
                  onUploadSuccess={(url) => setConfig({ ...config, foto_principal_url: url })}
                />
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">O escribe una URL directa:</label>
                  <input
                    type="text"
                    value={config.foto_principal_url}
                    onChange={(e) => setConfig({ ...config, foto_principal_url: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Teléfonos de Contacto Directo (Tarjeta Flotante)
                </label>
                <div>
                  <label className="text-xs text-gray-500">Teléfono 1</label>
                  <input
                    type="text"
                    value={config.telefono1}
                    onChange={(e) => setConfig({ ...config, telefono1: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Teléfono 2</label>
                  <input
                    type="text"
                    value={config.telefono2}
                    onChange={(e) => setConfig({ ...config, telefono2: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TEXTO CORPORATIVO, MISIÓN Y VISIÓN */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
              Misión, Visión y Filosofía Empresarial
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Texto Corporativo Principal
                </label>
                <textarea
                  rows={3}
                  value={config.texto_nosotros}
                  onChange={(e) => setConfig({ ...config, texto_nosotros: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Visión
                  </label>
                  <textarea
                    rows={3}
                    value={config.vision}
                    onChange={(e) => setConfig({ ...config, vision: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Misión
                  </label>
                  <textarea
                    rows={3}
                    value={config.mision}
                    onChange={(e) => setConfig({ ...config, mision: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DATOS DE UBICACIÓN Y CONTACTO */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
              Datos de Instalaciones y Medios de Contacto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Dirección Matriz
                </label>
                <input
                  type="text"
                  value={config.direccion}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Horario de Atención
                </label>
                <input
                  type="text"
                  value={config.horario}
                  onChange={(e) => setConfig({ ...config, horario: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email Oficial
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleGuardarContenido}
              disabled={saving}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 flex items-center gap-2 text-sm transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Guardando...' : 'Guardar Información de la Página'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIGRAMA & EQUIPO */}
      {tabActiva === 'equipo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Miembros del Organigrama
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Organiza los roles por nivel jerárquico y añade fotos de los especialistas de ventas y directivos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={restaurarEquipoDefaults}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Restaurar valores de muestra de REM Industrial"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Predeterminados</span>
                </button>
                <button
                  onClick={abrirModalNuevo}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Miembro</span>
                </button>
              </div>
            </div>

            {/* Lista / Grid de miembros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipo.map((m) => (
                <div
                  key={m.id}
                  className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 hover:bg-white hover:border-brand-400 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 border-2 border-brand-500/40 shrink-0 flex items-center justify-center">
                          {m.foto_url ? (
                            <img src={m.foto_url} alt={m.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900 leading-tight">
                            {m.nombre}
                          </h4>
                          <p className="text-xs text-brand-600 font-medium">
                            {m.puesto}
                          </p>
                          <span className="inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 mt-1">
                            {m.departamento} (Nivel {m.nivelJerarquico})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => abrirModalEditar(m)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => eliminarMiembro(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {m.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {m.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{m.telefono || 'Sin teléfono'}</span>
                    <span className="truncate max-w-[150px]">{m.email || 'Sin correo'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR O EDITAR MIEMBRO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {miembroEditando ? 'Editar Miembro del Organigrama' : 'Agregar Nuevo Miembro'}
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarMiembroForm} className="space-y-4">
              {/* Foto Uploader */}
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-brand-500/40 flex items-center justify-center shadow-xs">
                  {formFotoUrl ? (
                    <img src={formFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{subiendoFoto ? 'Subiendo...' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubirFotoMiembro}
                      className="hidden"
                      disabled={subiendoFoto}
                    />
                  </label>
                  {formFotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormFotoUrl('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="O escribe/pega URL de foto..."
                  value={formFotoUrl}
                  onChange={(e) => setFormFotoUrl(e.target.value)}
                  className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-gray-700 placeholder-gray-400 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              {/* Nombre y Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Carlos Mendoza"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Puesto / Título *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Asesor Técnico de Ventas"
                    value={formPuesto}
                    onChange={(e) => setFormPuesto(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Departamento y Nivel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Departamento
                  </label>
                  <select
                    value={formDepartamento}
                    onChange={(e) => setFormDepartamento(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nivel en Organigrama
                  </label>
                  <select
                    value={formNivel}
                    onChange={(e) => setFormNivel(Number(e.target.value) as 1 | 2 | 3)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1}>Nivel 1 (Dirección / Gerencia General)</option>
                    <option value={2}>Nivel 2 (Ventas Técnicas / Asesoría)</option>
                    <option value={3}>Nivel 3 (Cotizaciones / Soporte / Logística)</option>
                  </select>
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="6566341516"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ventasrem@remindustrial.mx"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Especialidad / Descripción breve
                </label>
                <textarea
                  rows={2}
                  placeholder="Especialista en herramientas de carburo, fresado y cuentas maquiladoras..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all"
                >
                  {miembroEditando ? 'Guardar Cambios' : 'Guardar y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
