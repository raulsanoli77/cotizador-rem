'use client';

import { useState, useMemo } from 'react';
import { X, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';
import { resolverCargaRapidaCodigos } from '@/app/catalogo/actions';
import { useCartStore } from '@/stores/cart-store';
import { supabase } from '@/lib/supabase/client';
import { formatearPrecio } from '@/lib/pricing/engine';

interface CargaRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LineaParseada {
  codigo: string;
  cantidad: number;
}

/**
 * Parsea texto pegado desde Excel, CSV o lista manual:
 * Soporta formatos:
 * - CODIGO [TAB] CANTIDAD
 * - CODIGO, CANTIDAD
 * - CODIGO; CANTIDAD
 * - CODIGO CANTIDAD
 * - CODIGO (cantidad = 1 por defecto)
 */
function parsearLineasTexto(raw: string): LineaParseada[] {
  if (!raw || !raw.trim()) return [];

  const lineas = raw.split(/\r?\n/);
  const mapaAcumulado = new Map<string, LineaParseada>();

  const palabrasEncabezado = new Set([
    'codigo', 'código', 'sku', 'parte', 'numero de parte', 'número de parte',
    'no. parte', 'part number', 'item', 'modelo', 'clave',
  ]);

  for (const lineaRaw of lineas) {
    const linea = lineaRaw.trim();
    if (!linea) continue;

    // Separar por tabulador, coma o punto y coma primero
    let partes = linea.split(/[\t,;]+/).map((s) => s.trim()).filter(Boolean);

    // Si no había tabulador ni coma, intentar separar si termina en espacio + número (ej. "41694 5" o "41694 x 5")
    if (partes.length === 1) {
      const matchEspacio = linea.match(/^(\S+?)(?:\s+[xX*]?\s+|\s+)(\d+)$/);
      if (matchEspacio) {
        partes = [matchEspacio[1].trim(), matchEspacio[2].trim()];
      }
    }

    const col1 = (partes[0] || '').trim();
    if (!col1) continue;

    // Ignorar fila de encabezado si viene de Excel
    if (palabrasEncabezado.has(col1.toLowerCase())) continue;

    let cantidad = 1;
    if (partes.length >= 2) {
      const numParsed = parseInt(partes[1].replace(/[^\d]/g, ''), 10);
      if (!isNaN(numParsed) && numParsed > 0) {
        cantidad = numParsed;
      }
    }

    const key = col1.toUpperCase();
    const existente = mapaAcumulado.get(key);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      mapaAcumulado.set(key, { codigo: col1, cantidad });
    }
  }

  return Array.from(mapaAcumulado.values());
}

export default function CargaRapidaModal({ isOpen, onClose }: CargaRapidaModalProps) {
  const [texto, setTexto] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{
    agregados: {
      numero_parte: string;
      marca: string;
      cantidadSolicitada: number;
      cantidadFinal: number;
      multiplo: number;
      precio_venta: number;
      moneda_venta: 'USD' | 'MXN';
    }[];
    noEncontrados: string[];
  } | null>(null);

  const agregarItem = useCartStore((s) => s.agregarItem);

  const lineasDetectadas = useMemo(() => parsearLineasTexto(texto), [texto]);

  if (!isOpen) return null;

  const handleProcesar = async () => {
    if (lineasDetectadas.length === 0) return;

    setProcesando(true);
    setResultado(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await resolverCargaRapidaCodigos(lineasDetectadas, session?.access_token || null);

      for (const item of res.encontrados) {
        agregarItem(item.producto, item.cantidadFinal);
      }

      setResultado({
        agregados: res.encontrados.map((e) => ({
          numero_parte: e.producto.numero_parte,
          marca: e.producto.marca,
          cantidadSolicitada: e.cantidadSolicitada,
          cantidadFinal: e.cantidadFinal,
          multiplo: e.multiplo,
          precio_venta: e.producto.precio_venta,
          moneda_venta: e.producto.moneda_venta,
        })),
        noEncontrados: res.noEncontrados,
      });

      if (res.noEncontrados.length === 0) {
        setTexto('');
      }
    } catch (err) {
      console.error('Error en carga rápida:', err);
      alert('Ocurrió un error al validar los códigos. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const handleReiniciar = () => {
    setTexto('');
    setResultado(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl border-2 border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Carga Rápida de Pedido (Excel / Códigos)</h2>
              <p className="text-xs text-slate-300">Pega tus códigos de parte y cantidades para armar tu cotización al instante</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">¿Cómo funciona?</p>
            <p>
              Copia dos columnas desde tu archivo de <strong>Excel</strong> (Columna A: <code>Número de Parte</code>, Columna B: <code>Cantidad</code>) y pégalas abajo, o escribe un código por línea:
            </p>
            <div className="mt-2 font-mono text-[11px] bg-white border border-slate-200 rounded-lg p-2 text-slate-700">
              41694 &nbsp;&nbsp;&nbsp;&nbsp; 10<br />
              30112 &nbsp;&nbsp;&nbsp;&nbsp; 5<br />
              500-196-30 &nbsp; 2
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lista de Códigos y Cantidades
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-brand-600">
                  {lineasDetectadas.length} {lineasDetectadas.length === 1 ? 'código detectado' : 'códigos detectados'}
                </span>
                {texto && (
                  <button
                    type="button"
                    onClick={handleReiniciar}
                    className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={6}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={"Pega aquí tus filas de Excel o escribe:\n41694\t10\n30112\t5"}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Vista previa rápida antes de procesar */}
          {lineasDetectadas.length > 0 && !resultado && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                Vista previa de líneas a buscar:
              </p>
              <div className="flex flex-wrap gap-2">
                {lineasDetectadas.map((l) => (
                  <span
                    key={l.codigo}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 shadow-2xs"
                  >
                    <span>{l.codigo}</span>
                    <span className="px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 font-sans text-[11px]">
                      x{l.cantidad}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resultado del procesamiento */}
          {resultado && (
            <div className="space-y-3">
              {resultado.agregados.length > 0 && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      ¡{resultado.agregados.length} {resultado.agregados.length === 1 ? 'producto agregado' : 'productos agregados'} a tu cotización!
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-emerald-200/60 text-xs">
                    {resultado.agregados.map((item) => (
                      <div key={item.numero_parte} className="py-1.5 flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-extrabold text-slate-900">{item.numero_parte}</span>
                          <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700 border border-emerald-200">
                            {item.marca}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-900">
                            {item.cantidadFinal} pzas
                          </span>
                          {item.multiplo > 1 && item.cantidadFinal !== item.cantidadSolicitada && (
                            <span className="block text-[10px] text-emerald-700">
                              (Ajustado a múltiplo de {item.multiplo})
                            </span>
                          )}
                          <span className="ml-2 text-slate-600 font-semibold">
                            • {formatearPrecio(item.precio_venta * item.cantidadFinal, item.moneda_venta)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resultado.noEncontrados.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {resultado.noEncontrados.length} {resultado.noEncontrados.length === 1 ? 'código no encontrado' : 'códigos no encontrados'} en el catálogo:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {resultado.noEncontrados.map((cod) => (
                      <span
                        key={cod}
                        className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg font-mono text-xs font-bold text-amber-900"
                      >
                        {cod}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-800 mt-2">
                    Verifica que el número de parte esté escrito correctamente o búscalo con el buscador superior.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie de acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleProcesar}
            disabled={procesando || lineasDetectadas.length === 0}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-600/20 disabled:shadow-none transition-all cursor-pointer"
          >
            {procesando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando códigos...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Agregar {lineasDetectadas.length > 0 ? `(${lineasDetectadas.length})` : ''} a Cotización
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
