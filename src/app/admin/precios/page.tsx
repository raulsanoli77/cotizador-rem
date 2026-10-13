'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Producto, EventoActualizacionPrecios } from '@/types/product';
import {
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  UploadCloud,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Loader2,
  X,
  FileSpreadsheet,
  Edit2,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  parsearExcelPrecios,
  generarPlantillaPreciosExcel,
  exportarReporteSaludExcel,
  exportarBitacoraExcel,
  ItemActualizacionPrecio,
} from '@/lib/excel/precios-parser';

interface ProductoConSalud extends Producto {
  diasSinActualizar: number;
  estadoSemaforo: 'al_dia' | 'vigencia_media' | 'en_riesgo';
  tieneNotaConfirmacion: boolean;
}

export default function AdminActualizarPreciosPage() {
  const [productos, setProductos] = useState<ProductoConSalud[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('Todas');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroSemaforo, setFiltroSemaforo] = useState<'todos' | 'al_dia' | 'vigencia_media' | 'en_riesgo' | 'con_nota'>('todos');

  // Paginación de Tabla
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(50);

  // Selección múltiple
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  // Edición Inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editCosto, setEditCosto] = useState<number>(0);
  const [editMoneda, setEditMoneda] = useState<'USD' | 'MXN'>('USD');
  const [guardandoInline, setGuardandoInline] = useState(false);

  // Modal de Carga Masiva Excel
  const [modalSubidaAbierto, setModalSubidaAbierto] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [analizandoArchivo, setAnalizandoArchivo] = useState(false);
  const [itemsExcel, setItemsExcel] = useState<ItemActualizacionPrecio[]>([]);
  const [erroresExcel, setErroresExcel] = useState<string[]>([]);
  const [advertenciasExcel, setAdvertenciasExcel] = useState<string[]>([]);
  const [marcaCarga, setMarcaCarga] = useState('');
  const [aplicandoPrecios, setAplicandoPrecios] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal de Bitácora
  const [modalBitacoraAbierto, setModalBitacoraAbierto] = useState(false);
  const [bitacora, setBitacora] = useState<EventoActualizacionPrecios[]>([]);
  const [cargandoBitacora, setCargandoBitacora] = useState(false);

  // Cargar datos (Paginado para soportar catálogos grandes que superen el límite de 1000 de Supabase)
  const cargarProductos = async () => {
    try {
      setLoading(true);
      const todosLosProductos: any[] = [];
      const PAGE_CHUNK = 1000;
      let from = 0;
      let hayMas = true;

      while (hayMas) {
        const { data: chunk, error: chunkError } = await supabase
          .from('productos')
          .select('*')
          .order('numero_parte', { ascending: true })
          .range(from, from + PAGE_CHUNK - 1);

        if (chunkError) throw chunkError;

        if (chunk && chunk.length > 0) {
          todosLosProductos.push(...chunk);
          if (chunk.length < PAGE_CHUNK) {
            hayMas = false;
          } else {
            from += PAGE_CHUNK;
          }
        } else {
          hayMas = false;
        }
      }

      const ahora = new Date().getTime();
      const marcasSet = new Set<string>();
      const categoriasSet = new Set<string>();

      const formateados: ProductoConSalud[] = todosLosProductos.map((p) => {
        if (p.marca) marcasSet.add(p.marca);
        if (p.categoria) categoriasSet.add(p.categoria);

        // Usar costo_actualizado_at preferentemente, o updated_at / created_at como fallback
        const rawFecha = p.costo_actualizado_at || p.updated_at || p.created_at;
        const fechaUpd = rawFecha ? new Date(rawFecha).getTime() : ahora;
        const dias = Math.floor(Math.max(0, ahora - fechaUpd) / (1000 * 60 * 60 * 24));

        let estado: 'al_dia' | 'vigencia_media' | 'en_riesgo' = 'al_dia';
        if (dias > 180) {
          estado = 'en_riesgo';
        } else if (dias >= 90) {
          estado = 'vigencia_media';
        }

        const specs = p.especificaciones_tecnicas || {};
        const tieneNota =
          p.requiere_confirmacion === true ||
          specs.requiere_confirmacion === true ||
          specs.requiere_confirmacion === 'true';

        return {
          ...p,
          diasSinActualizar: dias,
          estadoSemaforo: estado,
          tieneNotaConfirmacion: tieneNota,
        };
      });

      setProductos(formateados);
      setMarcas(Array.from(marcasSet).sort());
      setCategorias(Array.from(categoriasSet).sort());
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Cargar Bitácora con Token de Autorización Admin
  const cargarBitacora = async () => {
    try {
      setCargandoBitacora(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/actualizar-precios', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.bitacora) {
        setBitacora(data.bitacora);
      }
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
    } finally {
      setCargandoBitacora(false);
    }
  };

  // KPI Dashboard en Tiempo Real (se recalcula dinámicamente si se filtra por marca o categoría)
  const kpis = useMemo(() => {
    let base = productos;
    if (filtroMarca !== 'Todas') {
      base = base.filter((p) => p.marca?.toLowerCase() === filtroMarca.toLowerCase());
    }
    if (filtroCategoria !== 'Todas') {
      base = base.filter((p) => p.categoria?.toLowerCase() === filtroCategoria.toLowerCase());
    }

    const total = base.length;
    const alDia = base.filter((p) => p.estadoSemaforo === 'al_dia').length;
    const vigenciaMedia = base.filter((p) => p.estadoSemaforo === 'vigencia_media').length;
    const enRiesgo = base.filter((p) => p.estadoSemaforo === 'en_riesgo').length;
    const conNota = base.filter((p) => p.tieneNotaConfirmacion).length;

    return {
      total,
      alDia,
      vigenciaMedia,
      enRiesgo,
      conNota,
    };
  }, [productos, filtroMarca, filtroCategoria]);

  // Filtrado de la tabla
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Búsqueda por texto (Número de parte o serie / SKU interno)
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        const coincideParte = p.numero_parte?.toLowerCase().includes(q);
        const coincideSku = p.sku_interno?.toLowerCase().includes(q);
        if (!coincideParte && !coincideSku) return false;
      }

      // Filtro Marca
      if (filtroMarca !== 'Todas' && p.marca?.toLowerCase() !== filtroMarca.toLowerCase()) {
        return false;
      }

      // Filtro Categoría
      if (filtroCategoria !== 'Todas' && p.categoria?.toLowerCase() !== filtroCategoria.toLowerCase()) {
        return false;
      }

      // Filtro Semáforo
      if (filtroSemaforo === 'al_dia' && p.estadoSemaforo !== 'al_dia') return false;
      if (filtroSemaforo === 'vigencia_media' && p.estadoSemaforo !== 'vigencia_media') return false;
      if (filtroSemaforo === 'en_riesgo' && p.estadoSemaforo !== 'en_riesgo') return false;
      if (filtroSemaforo === 'con_nota' && !p.tieneNotaConfirmacion) return false;

      return true;
    });
  }, [productos, busqueda, filtroMarca, filtroCategoria, filtroSemaforo]);

  // Resetear a página 1 cuando cambia algún filtro o búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroMarca, filtroCategoria, filtroSemaforo]);

  // Cálculos de Paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / elementosPorPagina) || 1;
  const paginaAjustada = Math.min(Math.max(1, paginaActual), totalPaginas);

  const productosPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * elementosPorPagina;
    return productosFiltrados.slice(inicio, inicio + elementosPorPagina);
  }, [productosFiltrados, paginaAjustada, elementosPorPagina]);

  const todosEnPaginaSeleccionados =
    productosPaginados.length > 0 && productosPaginados.every((p) => seleccionados.has(p.id));

  const toggleSeleccionarPagina = () => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (todosEnPaginaSeleccionados) {
        productosPaginados.forEach((p) => nuevo.delete(p.id));
      } else {
        productosPaginados.forEach((p) => nuevo.add(p.id));
      }
      return nuevo;
    });
  };

  const seleccionarTodosLosFiltrados = () => {
    setSeleccionados(new Set(productosFiltrados.map((p) => p.id)));
  };

  // Mapas para cruce rápido con Excel
  const mapaProductosExistentes = useMemo(() => {
    const mapa = new Map<string, ProductoConSalud>();
    productos.forEach((p) => {
      if (p.numero_parte) mapa.set(p.numero_parte.trim().toUpperCase(), p);
      if (p.sku_interno) mapa.set(p.sku_interno.trim().toUpperCase(), p);
    });
    return mapa;
  }, [productos]);

  // Análisis y comparación del archivo Excel antes de aplicar
  const analisisPrevisualizacion = useMemo(() => {
    if (itemsExcel.length === 0) return null;

    let encontrados = 0;
    let noEncontrados = 0;
    const itemsComparados: Array<{
      numero_parte: string;
      nuevoCosto: number;
      nuevaMoneda: string;
      productoActual: ProductoConSalud | null;
      variacionPorcentaje: number | null;
      esVariacionExtrema: boolean;
      advertencia: string | null;
    }> = [];

    itemsExcel.forEach((item) => {
      const parteNorm = item.numero_parte.trim().toUpperCase();
      const actual = mapaProductosExistentes.get(parteNorm) || null;

      let variacion: number | null = null;
      let esExtrema = false;
      let adv: string | null = null;

      if (actual) {
        encontrados++;
        const costoAnt = actual.costo_base || 0;
        if (costoAnt > 0) {
          variacion = Math.round(((item.costo - costoAnt) / costoAnt) * 100);
          if (variacion >= 100) {
            esExtrema = true;
            adv = `Subida drástica de +${variacion}%`;
          } else if (variacion <= -50) {
            esExtrema = true;
            adv = `Bajada drástica de ${variacion}%`;
          }
        }
        if (item.costo === 0) {
          esExtrema = true;
          adv = 'Costo en $0.00';
        }
      } else {
        noEncontrados++;
        adv = 'No existe en catálogo';
      }

      itemsComparados.push({
        numero_parte: item.numero_parte,
        nuevoCosto: item.costo,
        nuevaMoneda: item.moneda || actual?.moneda_costo || 'USD',
        productoActual: actual,
        variacionPorcentaje: variacion,
        esVariacionExtrema: esExtrema,
        advertencia: adv,
      });
    });

    return {
      total: itemsExcel.length,
      encontrados,
      noEncontrados,
      itemsComparados,
      alertasExtremas: itemsComparados.filter((i) => i.esVariacionExtrema).length,
    };
  }, [itemsExcel, mapaProductosExistentes]);

  // Manejo de Selección
  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const seleccionarTodos = () => {
    if (seleccionados.size === productosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltrados.map((p) => p.id)));
    }
  };

  // Acciones en bloque optimizadas en un solo query .in('id', ids)
  const handleAccionEnBloque = async (accion: 'desactivar' | 'marcar_nota' | 'reactivar_normal') => {
    if (seleccionados.size === 0) return;

    const ids = Array.from(seleccionados);
    const mensajeConfirmacion =
      accion === 'desactivar'
        ? `¿Ocultar ${ids.length} productos seleccionados de la tienda pública?`
        : accion === 'marcar_nota'
        ? `¿Marcar ${ids.length} productos con la nota: "Precio y entrega sujetos a confirmación"?`
        : `¿Reactivar ${ids.length} productos con estado normal?`;

    if (!confirm(mensajeConfirmacion)) return;

    try {
      setLoading(true);

      if (accion === 'desactivar') {
        const { error } = await supabase.from('productos').update({ activo: false }).in('id', ids);
        if (error) throw error;
      } else if (accion === 'marcar_nota') {
        const { error } = await supabase
          .from('productos')
          .update({
            activo: true,
            requiere_confirmacion: true,
          })
          .in('id', ids);
        if (error) throw error;
      } else if (accion === 'reactivar_normal') {
        const { error } = await supabase
          .from('productos')
          .update({
            activo: true,
            requiere_confirmacion: false,
          })
          .in('id', ids);
        if (error) throw error;
      }

      setSeleccionados(new Set());
      await cargarProductos();
    } catch (err: any) {
      alert('Error al aplicar acción en bloque: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edición Inline Rápida
  const iniciarEdicionInline = (prod: ProductoConSalud) => {
    setEditandoId(prod.id);
    setEditCosto(prod.costo_base);
    setEditMoneda(prod.moneda_costo);
  };

  const cancelarEdicionInline = () => {
    setEditandoId(null);
  };

  const guardarEdicionInline = async (prod: ProductoConSalud) => {
    if (isNaN(editCosto) || editCosto < 0) {
      alert('Por favor ingresa un costo numérico válido mayor o igual a 0.');
      return;
    }

    try {
      setGuardandoInline(true);
      const specs = prod.especificaciones_tecnicas || {};
      const ahoraIso = new Date().toISOString();

      const { error } = await supabase
        .from('productos')
        .update({
          costo_base: editCosto,
          moneda_costo: editMoneda,
          costo_actualizado_at: ahoraIso,
          requiere_confirmacion: false,
        })
        .eq('id', prod.id);

      if (error) throw error;

      setEditandoId(null);
      await cargarProductos();
    } catch (err: any) {
      alert('Error guardando precio: ' + err.message);
    } finally {
      setGuardandoInline(false);
    }
  };

  // Descargas de Excel
  const descargarPlantilla = () => {
    const blob = generarPlantillaPreciosExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_actualizacion_precios_rem.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarReporteSalud = () => {
    const blob = exportarReporteSaludExcel(productosFiltrados);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_salud_precios_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarBitacoraExcelArchivo = async () => {
    let lista = bitacora;
    if (lista.length === 0) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const res = await fetch('/api/actualizar-precios', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.bitacora) lista = data.bitacora;
      } catch (err) {
        console.error(err);
      }
    }

    if (lista.length === 0) {
      alert('La bitácora de actualizaciones está vacía.');
      return;
    }

    const blob = exportarBitacoraExcel(lista);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitacora_actualizaciones_precios_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Procesamiento del archivo Excel
  const handleSeleccionarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoExcel(file);
    setAnalizandoArchivo(true);
    setResultadoCarga(null);

    try {
      const buffer = await file.arrayBuffer();
      const res = parsearExcelPrecios(buffer);
      setItemsExcel(res.items);
      setErroresExcel(res.errores);
      setAdvertenciasExcel(res.advertencias);
    } catch (err: any) {
      setErroresExcel(['Error al leer archivo: ' + err.message]);
    } finally {
      setAnalizandoArchivo(false);
    }
  };

  const handleAplicarPreciosExcel = async () => {
    if (itemsExcel.length === 0) return;

    try {
      setAplicandoPrecios(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/actualizar-precios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: itemsExcel,
          marca: marcaCarga.trim() || (filtroMarca !== 'Todas' ? filtroMarca : 'General'),
          usuario: sessionData?.session?.user?.email || 'Administrador',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aplicar actualización de precios');

      setResultadoCarga(data);
      await cargarProductos();
      await cargarBitacora();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setAplicandoPrecios(false);
    }
  };

  const cerrarModalSubida = () => {
    setModalSubidaAbierto(false);
    setArchivoExcel(null);
    setItemsExcel([]);
    setErroresExcel([]);
    setAdvertenciasExcel([]);
    setResultadoCarga(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Actualización de Precios & Auditoría
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Supervisa la vigencia de costos, sube listas de precios (3 columnas) y administra el catálogo con control de riesgos.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción de Cabecera */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setModalSubidaAbierto(true);
              setMarcaCarga(filtroMarca !== 'Todas' ? filtroMarca : '');
            }}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Subir Lista (Excel)</span>
          </button>

          <button
            onClick={descargarPlantilla}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5"
            title="Descargar plantilla de 3 columnas: numero_parte, costo, moneda"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Plantilla (3 cols)</span>
          </button>

          <button
            onClick={descargarReporteSalud}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5"
            title="Exportar reporte de salud de precios a Excel"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Reporte Salud</span>
          </button>

          <button
            onClick={() => {
              cargarBitacora();
              setModalBitacoraAbierto(true);
            }}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5"
            title="Ver y descargar bitácora de actualizaciones"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Bitácora</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SEMÁFORO EN TIEMPO REAL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 🟢 AL DÍA */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'al_dia' ? 'todos' : 'al_dia')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filtroSemaforo === 'al_dia'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Al Día (&lt; 90d)
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              {kpis.total > 0 ? Math.round((kpis.alDia / kpis.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.alDia.toLocaleString()}</div>
          <p className="text-[11px] text-gray-500 mt-1">Precios frescos y actualizados recientemente</p>
        </div>

        {/* 🟡 VIGENCIA MEDIA */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'vigencia_media' ? 'todos' : 'vigencia_media')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filtroSemaforo === 'vigencia_media'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Vigencia Media (90-180d)
            </span>
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {kpis.total > 0 ? Math.round((kpis.vigenciaMedia / kpis.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.vigenciaMedia.toLocaleString()}</div>
          <p className="text-[11px] text-gray-500 mt-1">Requieren revisión preventiva de costos</p>
        </div>

        {/* 🔴 EN RIESGO */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'en_riesgo' ? 'todos' : 'en_riesgo')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filtroSemaforo === 'en_riesgo'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-white border-gray-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              En Riesgo (&gt; 180d)
            </span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
              {kpis.total > 0 ? Math.round((kpis.enRiesgo / kpis.total) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.enRiesgo.toLocaleString()}</div>
          <p className="text-[11px] text-gray-500 mt-1">Costos desfasados o posible producto descontinuado</p>
        </div>

        {/* ⚠️ CON NOTA DE CONFIRMACIÓN */}
        <div
          onClick={() => setFiltroSemaforo(filtroSemaforo === 'con_nota' ? 'todos' : 'con_nota')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            filtroSemaforo === 'con_nota'
              ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30'
              : 'bg-white border-gray-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-sky-600" />
              Con Nota Preventiva
            </span>
            <span className="text-[11px] font-semibold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
              {kpis.conNota}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.conNota.toLocaleString()}</div>
          <p className="text-[11px] text-gray-500 mt-1">Visibles con leyenda: "Sujeto a confirmación"</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Búsqueda por Número de Parte o Serie / SKU */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por Número de Parte o por Serie / SKU interno..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-brand-500 focus:bg-white transition-all"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Marca (Recalcula KPIs dinámicamente) */}
          <div className="w-full md:w-56">
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:border-brand-500"
            >
              <option value="Todas">Todas las Marcas ({marcas.length})</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoría */}
          <div className="w-full md:w-56">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-hidden focus:border-brand-500"
            >
              <option value="Todas">Todas las Categorías ({categorias.length})</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filtro Semáforo si está activo */}
          {filtroSemaforo !== 'todos' && (
            <button
              onClick={() => setFiltroSemaforo('todos')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <span>Semáforo: {filtroSemaforo.replace('_', ' ')}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* BARRA DE ACCIONES EN BLOQUE (Si hay elementos seleccionados) */}
        {seleccionados.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 bg-brand-50/50 p-3 rounded-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-brand-900">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                {seleccionados.size}
              </span>
              <span>artículos seleccionados</span>
              {seleccionados.size < productosFiltrados.length && (
                <button
                  type="button"
                  onClick={seleccionarTodosLosFiltrados}
                  className="ml-2 text-xs font-semibold text-brand-700 hover:text-brand-900 underline"
                >
                  Seleccionar los {productosFiltrados.length} productos filtrados
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAccionEnBloque('desactivar')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Ocultar de la tienda pública"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Desactivar (Ocultar)</span>
              </button>

              <button
                onClick={() => handleAccionEnBloque('marcar_nota')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Mostrar con sello de precio sujeto a confirmación"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mostrar con Nota de Confirmación</span>
              </button>

              <button
                onClick={() => handleAccionEnBloque('reactivar_normal')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Quitar nota y activar como normal"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Reactivar Normal</span>
              </button>

              <button
                onClick={() => setSeleccionados(new Set())}
                className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLA PRINCIPAL DE PRODUCTOS CON EDICIÓN INLINE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-500">
          <div>
            Mostrando <span className="font-bold text-gray-900">{productosFiltrados.length}</span> de{' '}
            <span className="font-bold text-gray-900">{productos.length}</span> productos
            {filtroMarca !== 'Todas' && <span className="ml-1 text-brand-600 font-bold">({filtroMarca})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cargarProductos}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Recargar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={todosEnPaginaSeleccionados}
                    onChange={toggleSeleccionarPagina}
                    className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                    title={
                      todosEnPaginaSeleccionados
                        ? 'Deseleccionar todos en esta página'
                        : 'Seleccionar todos en esta página'
                    }
                  />
                </th>
                <th className="p-3">Número de Parte</th>
                <th className="p-3">Serie / SKU</th>
                <th className="p-3">Marca</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-right">Costo Base</th>
                <th className="p-3 text-center">Moneda</th>
                <th className="p-3 text-center">Última Actualización</th>
                <th className="p-3 text-center">Semáforo</th>
                <th className="p-3 text-center">Estado Tienda</th>
                <th className="p-3 text-center w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    <span>Cargando catálogo y analizando salud de precios...</span>
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-gray-400">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productosPaginados.map((p) => {
                  const estaSeleccionado = seleccionados.has(p.id);
                  const estaEditando = editandoId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        estaSeleccionado ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => toggleSeleccion(p.id)}
                          className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Número de Parte */}
                      <td className="p-3 font-mono font-bold text-gray-900 text-xs sm:text-sm">
                        {p.numero_parte}
                      </td>

                      {/* Serie / SKU */}
                      <td className="p-3 font-mono text-gray-500 text-xs">{p.sku_interno || '-'}</td>

                      {/* Marca */}
                      <td className="p-3 font-semibold text-gray-700">{p.marca}</td>

                      {/* Categoría */}
                      <td className="p-3 text-gray-500 truncate max-w-[140px]">{p.categoria}</td>

                      {/* Costo Base (Edición Inline) */}
                      <td className="p-3 text-right">
                        {estaEditando ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editCosto}
                            onChange={(e) => setEditCosto(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right px-2 py-1 text-xs border border-brand-500 rounded-lg focus:outline-hidden font-mono font-bold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') guardarEdicionInline(p);
                              if (e.key === 'Escape') cancelarEdicionInline();
                            }}
                          />
                        ) : (
                          <span
                            onDoubleClick={() => iniciarEdicionInline(p)}
                            title="Doble clic para editar al vuelo"
                            className="font-mono font-bold text-gray-900 cursor-pointer hover:text-brand-600 px-1 py-0.5 rounded-sm hover:bg-gray-100"
                          >
                            ${(p.costo_base || 0).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Moneda */}
                      <td className="p-3 text-center">
                        {estaEditando ? (
                          <select
                            value={editMoneda}
                            onChange={(e) => setEditMoneda(e.target.value as 'USD' | 'MXN')}
                            className="px-1.5 py-1 text-xs border border-brand-500 rounded-lg font-bold"
                          >
                            <option value="USD">USD</option>
                            <option value="MXN">MXN</option>
                          </select>
                        ) : (
                          <span className="font-mono font-semibold text-gray-500">{p.moneda_costo || 'USD'}</span>
                        )}
                      </td>

                      {/* Última Actualización */}
                      <td className="p-3 text-center text-gray-600 font-mono text-[11px]">
                        <div>
                          {p.costo_actualizado_at
                            ? new Date(p.costo_actualizado_at).toLocaleDateString('es-MX')
                            : p.updated_at
                            ? new Date(p.updated_at).toLocaleDateString('es-MX')
                            : 'Sin registro'}
                        </div>
                        <div className="text-[10px] text-gray-400">hace {p.diasSinActualizar} días</div>
                      </td>

                      {/* Semáforo */}
                      <td className="p-3 text-center">
                        {p.estadoSemaforo === 'al_dia' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Al Día
                          </span>
                        )}
                        {p.estadoSemaforo === 'vigencia_media' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            Vig. Media
                          </span>
                        )}
                        {p.estadoSemaforo === 'en_riesgo' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            En Riesgo
                          </span>
                        )}
                      </td>

                      {/* Estado Tienda */}
                      <td className="p-3 text-center">
                        {!p.activo ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            Oculto
                          </span>
                        ) : p.tieneNotaConfirmacion ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            title="Muestra leyenda: Sujeto a confirmación"
                          >
                            Con Nota
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Activo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-center">
                        {estaEditando ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => guardarEdicionInline(p)}
                              disabled={guardandoInline}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelarEdicionInline}
                              className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarEdicionInline(p)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                            title="Editar costo al vuelo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BARRA DE PAGINACIÓN */}
        {productosFiltrados.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <span>
                Mostrando{' '}
                <strong className="text-gray-900">
                  {(paginaAjustada - 1) * elementosPorPagina + 1}
                </strong>{' '}
                -{' '}
                <strong className="text-gray-900">
                  {Math.min(paginaAjustada * elementosPorPagina, productosFiltrados.length)}
                </strong>{' '}
                de <strong className="text-gray-900">{productosFiltrados.length}</strong> productos
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
                <span className="text-gray-500 text-[11px]">Por página:</span>
                <select
                  value={elementosPorPagina}
                  onChange={(e) => {
                    setElementosPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-800 font-semibold focus:outline-hidden focus:border-brand-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaActual(1)}
                disabled={paginaAjustada <= 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaAjustada <= 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-gray-800">
                Página {paginaAjustada} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAjustada >= totalPaginas}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaAjustada >= totalPaginas}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBIR LISTA DE PRECIOS (EXCEL 3 COLUMNAS CON ESCUDO Y PREVIEW) */}
      {modalSubidaAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-100 text-brand-700 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Actualización Rápida de Precios (Excel)</h3>
                  <p className="text-xs text-gray-500">
                    Sube un archivo de 3 columnas: <span className="font-mono font-bold">numero_parte</span>,{' '}
                    <span className="font-mono font-bold">costo</span>,{' '}
                    <span className="font-mono font-bold">moneda</span>
                  </p>
                </div>
              </div>
              <button onClick={cerrarModalSubida} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {!archivoExcel ? (
                /* Zona de Carga Drag & Drop */
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-brand-500 bg-gray-50/60 hover:bg-brand-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        Haz clic aquí para seleccionar tu archivo Excel o CSV
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Soporta archivos .xlsx, .xls y .csv</p>
                    </div>
                    <div className="inline-block text-xs font-semibold text-brand-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                      Solo requiere: numero_parte | costo | moneda
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleSeleccionarArchivo}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                    <span>¿No tienes el formato exacto?</span>
                    <button
                      type="button"
                      onClick={descargarPlantilla}
                      className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar plantilla de ejemplo
                    </button>
                  </div>
                </div>
              ) : analizandoArchivo ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-2" />
                  <p className="text-sm font-bold text-gray-700">Analizando archivo y cruzando datos con catálogo...</p>
                </div>
              ) : resultadoCarga ? (
                /* Pantalla de Éxito */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">{resultadoCarga.message}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Total procesados: {resultadoCarga.total_procesados} | Actualizados:{' '}
                      <span className="font-bold text-emerald-600">{resultadoCarga.actualizados}</span>
                    </p>
                  </div>

                  {resultadoCarga.no_encontrados && resultadoCarga.no_encontrados.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left max-w-lg mx-auto">
                      <div className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{resultadoCarga.no_encontrados.length} números de parte no existían en catálogo:</span>
                      </div>
                      <div className="max-h-32 overflow-y-auto text-[11px] font-mono text-gray-600 space-y-0.5">
                        {resultadoCarga.no_encontrados.map((c: string, idx: number) => (
                          <div key={idx}>• {c}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={cerrarModalSubida}
                      className="px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-brand-700"
                    >
                      Aceptar y Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* PREVISUALIZACIÓN Y ESCUDO PROTECTOR ANTES DE APLICAR */
                <div className="space-y-4">
                  {/* Resumen del cruce */}
                  {analisisPrevisualizacion && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                        <span className="text-[11px] font-semibold text-gray-500 block">Total en Excel</span>
                        <span className="text-lg font-black text-gray-900">
                          {analisisPrevisualizacion.total}
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                        <span className="text-[11px] font-semibold text-emerald-700 block">Coincidencias en Catálogo</span>
                        <span className="text-lg font-black text-emerald-700">
                          {analisisPrevisualizacion.encontrados}
                        </span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                        <span className="text-[11px] font-semibold text-amber-700 block">No Encontrados</span>
                        <span className="text-lg font-black text-amber-700">
                          {analisisPrevisualizacion.noEncontrados}
                        </span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                        <span className="text-[11px] font-semibold text-rose-700 block">Variaciones Extremas</span>
                        <span className="text-lg font-black text-rose-700">
                          {analisisPrevisualizacion.alertasExtremas}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Asignar Marca para la Bitácora */}
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                    <label className="font-bold text-gray-700 shrink-0">Marca asociada a esta carga:</label>
                    <input
                      type="text"
                      placeholder="Ej. Kyocera, Kennametal, General..."
                      value={marcaCarga}
                      onChange={(e) => setMarcaCarga(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  {/* Alerta de Errores o Variaciones */}
                  {analisisPrevisualizacion && analisisPrevisualizacion.alertasExtremas > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">¡Escudo Protector de Precios activado!</span> Se detectaron{' '}
                        {analisisPrevisualizacion.alertasExtremas} artículos con cambios drásticos (+100%, -50% o $0).
                        Verifica las filas resaltadas en rojo abajo antes de confirmar.
                      </div>
                    </div>
                  )}

                  {/* Tabla de Previsualización */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-100 text-gray-600 font-bold sticky top-0 text-[11px]">
                        <tr>
                          <th className="p-2.5">No. Parte</th>
                          <th className="p-2.5">Marca</th>
                          <th className="p-2.5 text-right">Costo Anterior</th>
                          <th className="p-2.5 text-right">Nuevo Costo</th>
                          <th className="p-2.5 text-center">Moneda</th>
                          <th className="p-2.5 text-center">Variación</th>
                          <th className="p-2.5">Estado / Alerta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {analisisPrevisualizacion?.itemsComparados.map((item, idx) => (
                          <tr
                            key={idx}
                            className={
                              item.esVariacionExtrema
                                ? 'bg-rose-50/60'
                                : !item.productoActual
                                ? 'bg-amber-50/40'
                                : 'hover:bg-gray-50'
                            }
                          >
                            <td className="p-2 font-mono font-bold text-gray-800">{item.numero_parte}</td>
                            <td className="p-2 text-gray-600">{item.productoActual?.marca || '-'}</td>
                            <td className="p-2 text-right font-mono text-gray-500">
                              {item.productoActual ? `$${(item.productoActual.costo_base || 0).toFixed(2)}` : '-'}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-gray-900">
                              ${item.nuevoCosto.toFixed(2)}
                            </td>
                            <td className="p-2 text-center font-mono text-gray-600">{item.nuevaMoneda}</td>
                            <td className="p-2 text-center font-mono font-bold">
                              {item.variacionPorcentaje !== null ? (
                                <span
                                  className={
                                    item.variacionPorcentaje > 0
                                      ? 'text-rose-600'
                                      : item.variacionPorcentaje < 0
                                      ? 'text-emerald-600'
                                      : 'text-gray-400'
                                  }
                                >
                                  {item.variacionPorcentaje > 0 ? `+${item.variacionPorcentaje}%` : `${item.variacionPorcentaje}%`}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-2">
                              {item.advertencia ? (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                                    item.esVariacionExtrema
                                      ? 'bg-rose-200 text-rose-900'
                                      : 'bg-amber-200 text-amber-900'
                                  }`}
                                >
                                  {item.advertencia}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                                  Listo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal con Botones */}
            {archivoExcel && !resultadoCarga && !analizandoArchivo && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setArchivoExcel(null);
                    setItemsExcel([]);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cambiar archivo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cerrarModalSubida}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={aplicandoPrecios || itemsExcel.length === 0}
                    onClick={handleAplicarPreciosExcel}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aplicandoPrecios ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aplicando {itemsExcel.length} precios...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar y Aplicar Precios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: BITÁCORA DE ACTUALIZACIONES HISTÓRICAS */}
      {modalBitacoraAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in-50 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Bitácora de Cargas y Actualizaciones</h3>
                  <p className="text-xs text-gray-500">Historial cronológico de cambios de precios realizados en el sistema</p>
                </div>
              </div>
              <button
                onClick={() => setModalBitacoraAbierto(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">
                  Total de eventos registrados: <strong className="text-gray-900">{bitacora.length}</strong>
                </span>
                <button
                  onClick={descargarBitacoraExcelArchivo}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Descargar la bitácora completa en archivo Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Bitácora (Excel)</span>
                </button>
              </div>

              {cargandoBitacora ? (
                <div className="py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                  <span>Cargando bitácora...</span>
                </div>
              ) : bitacora.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Aún no hay registros de actualizaciones de precios en la bitácora.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {bitacora.map((ev) => (
                    <div key={ev.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{ev.marca || 'General'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{ev.usuario}</span>
                        </div>
                        <span className="font-mono text-gray-500 text-[11px]">
                          {ev.fecha ? new Date(ev.fecha).toLocaleString('es-MX') : '-'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {ev.total_actualizados} actualizados
                        </span>
                        {ev.total_no_encontrados > 0 && (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            {ev.total_no_encontrados} no encontrados
                          </span>
                        )}
                        <span className="text-gray-400">Total en archivo: {ev.total_procesados}</span>
                      </div>

                      {ev.no_encontrados && ev.no_encontrados.length > 0 && (
                        <details className="text-[11px] text-gray-500 pt-1">
                          <summary className="cursor-pointer hover:text-brand-600">
                            Ver códigos no encontrados ({ev.no_encontrados.length})
                          </summary>
                          <p className="mt-1 font-mono bg-gray-50 p-2 rounded-md text-gray-700 max-h-24 overflow-y-auto">
                            {ev.no_encontrados.join(', ')}
                          </p>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setModalBitacoraAbierto(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
