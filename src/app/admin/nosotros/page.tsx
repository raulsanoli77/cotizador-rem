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
  X, 
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import ImageUploader from '@/components/admin/ImageUploader';
import { 
  NosotrosConfig, 
  NOSOTROS_CONFIG_DEFAULT, 
  RECUADROS_HERO_DEFAULT,
  RecuadroHeroItem,
  MiembroEquipo, 
  EQUIPO_INICIAL,
  TelefonoItem,
  EmailItem,
  DireccionItem,
  normalizarNosotrosConfig
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
              setConfig(normalizarNosotrosConfig(item.valor));
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

  // MANEJO DE TELÉFONOS DINÁMICOS
  const agregarTelefono = () => {
    const nuevo: TelefonoItem = {
      id: `tel-${Date.now()}`,
      titulo: 'Nuevo Teléfono / WhatsApp',
      numero: '(656) ',
    };
    setConfig({
      ...config,
      telefonos: [...config.telefonos, nuevo],
    });
  };

  const actualizarTelefono = (id: string, campo: 'titulo' | 'numero', valor: string) => {
    setConfig({
      ...config,
      telefonos: config.telefonos.map((t) => (t.id === id ? { ...t, [campo]: valor } : t)),
    });
  };

  const eliminarTelefono = (id: string) => {
    if (config.telefonos.length <= 1) {
      alert('Debes mantener al menos un número telefónico de contacto.');
      return;
    }
    setConfig({
      ...config,
      telefonos: config.telefonos.filter((t) => t.id !== id),
    });
  };

  // MANEJO DE CORREOS DINÁMICOS
  const agregarEmail = () => {
    const nuevo: EmailItem = {
      id: `email-${Date.now()}`,
      titulo: 'Nuevo Correo',
      email: 'contacto@remindustrial.mx',
    };
    setConfig({
      ...config,
      emails: [...config.emails, nuevo],
    });
  };

  const actualizarEmail = (id: string, campo: 'titulo' | 'email', valor: string) => {
    setConfig({
      ...config,
      emails: config.emails.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)),
    });
  };

  const eliminarEmail = (id: string) => {
    if (config.emails.length <= 1) {
      alert('Debes mantener al menos un correo de contacto.');
      return;
    }
    setConfig({
      ...config,
      emails: config.emails.filter((e) => e.id !== id),
    });
  };

  // MANEJO DE DIRECCIONES / SUCURSALES DINÁMICAS
  const agregarDireccion = () => {
    const nuevo: DireccionItem = {
      id: `dir-${Date.now()}`,
      titulo: 'Nueva Sucursal / Sede',
      direccion: 'Ciudad, Estado, México',
      detalles: 'Oficina y atención a clientes',
    };
    setConfig({
      ...config,
      direcciones: [...config.direcciones, nuevo],
    });
  };

  const actualizarDireccion = (id: string, campo: 'titulo' | 'direccion' | 'detalles', valor: string) => {
    setConfig({
      ...config,
      direcciones: config.direcciones.map((d) => (d.id === id ? { ...d, [campo]: valor } : d)),
    });
  };

  const eliminarDireccion = (id: string) => {
    if (config.direcciones.length <= 1) {
      alert('Debes mantener al menos una dirección principal.');
      return;
    }
    setConfig({
      ...config,
      direcciones: config.direcciones.filter((d) => d.id !== id),
    });
  };

  // MANEJO DE PILARES DE VALOR
  const actualizarPilar = (id: string, campo: 'titulo' | 'descripcion' | 'icono', valor: string) => {
    setConfig({
      ...config,
      pilares: (config.pilares || []).map((p) => (p.id === id ? { ...p, [campo]: valor } : p)),
    });
  };

  // MANEJO DE RECUADROS HERO (ESTADÍSTICAS Y COBERTURA)
  const actualizarRecuadroHero = (id: string, campo: 'destacado' | 'subtitulo', valor: string) => {
    setConfig({
      ...config,
      recuadros_hero: (config.recuadros_hero || RECUADROS_HERO_DEFAULT).map((r) =>
        r.id === id ? { ...r, [campo]: valor } : r
      ),
    });
  };

  // MANEJO DE MODAL DE MIEMBROS ORGANIGRAMA
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
            Gestiona la información institucional, teléfonos con título, correos, múltiples direcciones y el organigrama del equipo.
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
          <span>Contenido, Contactos & Sucursales</span>
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

      {/* TAB 1: CONTENIDO, CONTACTOS & SUCURSALES */}
      {tabActiva === 'contenido' && (
        <div className="space-y-6">
          
          {/* FOTOGRAFÍA OFICIAL */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
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
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  O escribe una URL directa:
                </label>
                <input
                  type="text"
                  value={config.foto_principal_url}
                  onChange={(e) => setConfig({ ...config, foto_principal_url: e.target.value })}
                  placeholder="/images/equipo-rem.jpg"
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Esta fotografía se muestra en la sección principal de Acerca de Nosotros de manera completa y limpia.
                </p>
              </div>
            </div>
          </div>

          {/* TELÉFONOS Y CORREOS JUNTOS (DINÁMICOS Y CON TÍTULO EDITABLE) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Medios de Contacto Directo (Teléfonos y Correos)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Añade y personaliza los títulos de cada teléfono y correo. Se muestran en la tarjeta flotante y en la sección de contacto.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* COLUMNA 1: TELÉFONOS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Teléfonos de Contacto
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={agregarTelefono}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Teléfono</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {config.telefonos.map((tel, idx) => (
                    <div
                      key={tel.id}
                      className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 hover:border-brand-400 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">
                          Teléfono #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarTelefono(tel.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          title="Eliminar este teléfono"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            Título / Etiqueta
                          </label>
                          <input
                            type="text"
                            value={tel.titulo}
                            onChange={(e) => actualizarTelefono(tel.id, 'titulo', e.target.value)}
                            placeholder="Ej. Oficina Matriz, Línea 2, WhatsApp"
                            className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            Número Telefónico
                          </label>
                          <input
                            type="text"
                            value={tel.numero}
                            onChange={(e) => actualizarTelefono(tel.id, 'numero', e.target.value)}
                            placeholder="Ej. (656) 634 1516"
                            className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA 2: CORREOS ELECTRÓNICOS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Correos Electrónicos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={agregarEmail}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Correo</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {config.emails.map((em, idx) => (
                    <div
                      key={em.id}
                      className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 hover:border-brand-400 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase">
                          Correo #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarEmail(em.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          title="Eliminar este correo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            Título / Etiqueta
                          </label>
                          <input
                            type="text"
                            value={em.titulo}
                            onChange={(e) => actualizarEmail(em.id, 'titulo', e.target.value)}
                            placeholder="Ej. Ventas Generales, Cotizaciones"
                            className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={em.email}
                            onChange={(e) => actualizarEmail(em.id, 'email', e.target.value)}
                            placeholder="ventasrem@remindustrial.mx"
                            className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SUCURSALES Y DIRECCIONES FÍSICAS (MÚLTIPLES DIRECCIONES) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Sucursales & Direcciones Físicas
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gestiona las sedes de la empresa (Cd. Juárez, El Paso TX, Chihuahua Capital, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={agregarDireccion}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Dirección / Sucursal</span>
              </button>
            </div>

            <div className="space-y-4">
              {config.direcciones.map((dir, idx) => (
                <div
                  key={dir.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 hover:border-brand-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {dir.titulo || `Sucursal #${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarDireccion(dir.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      title="Eliminar esta dirección"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Título de la Sede / Sucursal *
                      </label>
                      <input
                        type="text"
                        value={dir.titulo}
                        onChange={(e) => actualizarDireccion(dir.id, 'titulo', e.target.value)}
                        placeholder="Ej. Matriz Cd. Juárez, Oficina El Paso TX"
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-500 font-semibold"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Dirección Completa *
                      </label>
                      <input
                        type="text"
                        value={dir.direccion}
                        onChange={(e) => actualizarDireccion(dir.id, 'direccion', e.target.value)}
                        placeholder="Calle, número, colonia, código postal, ciudad y estado"
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Detalles / Nota Adicional (Opcional)
                      </label>
                      <input
                        type="text"
                        value={dir.detalles || ''}
                        onChange={(e) => actualizarDireccion(dir.id, 'detalles', e.target.value)}
                        placeholder="Ej. Oficinas corporativas, almacén y mostrador de entrega"
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Horario General de Atención
              </label>
              <input
                type="text"
                value={config.horario}
                onChange={(e) => setConfig({ ...config, horario: e.target.value })}
                placeholder="Lunes a Viernes: 08:00 AM - 05:00 PM"
                className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
              />
            </div>
          </div>

          {/* ENCABEZADOS Y TEXTOS DE LA EMPRESA */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
              Identidad, Misión y Visión
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Insignia / Badge Superior
                </label>
                <input
                  type="text"
                  value={config.badge}
                  onChange={(e) => setConfig({ ...config, badge: e.target.value })}
                  placeholder="Tú Socio Industrial"
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Presencia y Expansión (Franja de Ciudades)
                </label>
                <input
                  type="text"
                  value={config.presencia_ciudades}
                  onChange={(e) => setConfig({ ...config, presencia_ciudades: e.target.value })}
                  placeholder="Ciudad Juárez • El Paso TX • Próxima apertura Chihuahua Capital • Envíos a todo México"
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Título Hero
                </label>
                <input
                  type="text"
                  value={config.titulo_hero}
                  onChange={(e) => setConfig({ ...config, titulo_hero: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subtítulo Hero
                </label>
                <textarea
                  rows={2}
                  value={config.subtitulo_hero}
                  onChange={(e) => setConfig({ ...config, subtitulo_hero: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2 resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Texto Corporativo Principal
                </label>
                <textarea
                  rows={3}
                  value={config.texto_nosotros}
                  onChange={(e) => setConfig({ ...config, texto_nosotros: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Visión
                </label>
                <textarea
                  rows={3}
                  value={config.vision}
                  onChange={(e) => setConfig({ ...config, vision: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
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
                  className="w-full text-sm border border-gray-300 rounded-xl px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* RECUADROS DESTACADOS DEL HERO (ESTADÍSTICAS Y COBERTURA) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Tarjetas de Impacto Superior (Hero)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Personaliza los 4 recuadros destacados bajo el título principal (Distribución de Marcas, Presencia Binacional, Envíos a la República Mexicana, Soporte Técnico).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(config.recuadros_hero || RECUADROS_HERO_DEFAULT).map((rec, idx) => (
                <div
                  key={rec.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 hover:border-brand-400 transition-colors"
                >
                  <div className="border-b border-gray-200/80 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">
                      Tarjeta #{idx + 1}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Texto Destacado
                    </label>
                    <input
                      type="text"
                      value={rec.destacado}
                      onChange={(e) => actualizarRecuadroHero(rec.id, 'destacado', e.target.value)}
                      placeholder="Ej. Distribución"
                      className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-cyan-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Descripción / Subtítulo
                    </label>
                    <input
                      type="text"
                      value={rec.subtitulo}
                      onChange={(e) => actualizarRecuadroHero(rec.id, 'subtitulo', e.target.value)}
                      placeholder="Ej. Marcas Globales de Prestigio"
                      className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECUADROS DE PILARES DE VALOR INDUSTRIAL (POR QUÉ ELEGIRNOS) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                Recuadros de Fortalezas y Pilares (&quot;Por Qué Elegirnos&quot;)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Personaliza los 4 recuadros de valor que aparecen en la página pública de Sobre Nosotros.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(config.pilares || []).map((pilar, idx) => (
                <div
                  key={pilar.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3 hover:border-brand-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
                    <span className="text-xs font-bold text-gray-700">
                      Recuadro #{idx + 1}
                    </span>
                    <select
                      value={pilar.icono || 'shield'}
                      onChange={(e) => actualizarPilar(pilar.id, 'icono', e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white font-medium text-gray-700"
                    >
                      <option value="shield">Ícono: Calidad (Escudo)</option>
                      <option value="zap">Ícono: Rapidez (Rayo)</option>
                      <option value="wrench">Ícono: Soporte (Herramienta)</option>
                      <option value="truck">Ícono: Envíos (Camión)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Título del Recuadro
                    </label>
                    <input
                      type="text"
                      value={pilar.titulo}
                      onChange={(e) => actualizarPilar(pilar.id, 'titulo', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Descripción del Recuadro
                    </label>
                    <textarea
                      rows={2}
                      value={pilar.descripcion}
                      onChange={(e) => actualizarPilar(pilar.id, 'descripcion', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-500 resize-none"
                    />
                  </div>
                </div>
              ))}
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
