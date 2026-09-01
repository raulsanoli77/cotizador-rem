'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import type { CampoFiltro } from '@/types/product';

interface FilterSidebarProps {
  campos: CampoFiltro[];
  filtrosActivos: Record<string, string | number | null>;
  onFiltroChange: (nombre: string, valor: string | number | null) => void;
  onLimpiarFiltros: () => void;
  marcas: string[];
}

export default function FilterSidebar({ campos, filtrosActivos, onFiltroChange, onLimpiarFiltros, marcas }: FilterSidebarProps) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});
  const toggleSeccion = (nombre: string) => setSeccionesAbiertas((p) => ({ ...p, [nombre]: !p[nombre] }));
  const tieneFiltros = Object.keys(filtrosActivos).length > 0;

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 lg:sticky lg:top-20 self-start overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-300" />
          <h2 className="font-semibold text-sm tracking-wide">FILTROS</h2>
        </div>
        {tieneFiltros && (
          <button onClick={onLimpiarFiltros} className="text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">Limpiar</button>
        )}
      </div>

      <div className="p-4">
        {/* Marca */}
        <div className="border-b border-slate-100 pb-3 mb-3">
        <button onClick={() => toggleSeccion('marca')} className="flex items-center justify-between w-full text-sm font-medium text-gray-700 py-1">
          <span>Marca</span>
          {seccionesAbiertas['marca'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {seccionesAbiertas['marca'] && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {marcas.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                <input type="radio" name="marca" checked={filtrosActivos['marca'] === m} onChange={() => onFiltroChange('marca', filtrosActivos['marca'] === m ? null : m)} className="text-brand-600" />
                {m}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dinámicos */}
      {campos.map((campo) => (
        <div key={campo.nombre} className="border-b border-gray-100 pb-3 mb-3 last:border-0">
          <button onClick={() => toggleSeccion(campo.nombre)} className="flex items-center justify-between w-full text-sm font-medium text-gray-700 py-1">
            <span>{campo.nombre}{campo.unidad ? ` (${campo.unidad})` : ''}</span>
            {seccionesAbiertas[campo.nombre] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {seccionesAbiertas[campo.nombre] && campo.tipo === 'seleccion' && campo.opciones && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {campo.opciones.map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="radio" name={campo.nombre} checked={filtrosActivos[campo.nombre] === op} onChange={() => onFiltroChange(campo.nombre, filtrosActivos[campo.nombre] === op ? null : op)} className="text-brand-600" />
                  {op}
                </label>
              ))}
            </div>
          )}
          {seccionesAbiertas[campo.nombre] && campo.tipo === 'texto' && (
            <input type="text" placeholder={`Buscar ${campo.nombre.toLowerCase()}...`} value={(filtrosActivos[campo.nombre] as string) || ''} onChange={(e) => onFiltroChange(campo.nombre, e.target.value || null)} className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500" />
          )}
        </div>
      ))}
      </div>
    </aside>
  );
}
