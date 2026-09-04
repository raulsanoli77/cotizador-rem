'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import type { CampoFiltro } from '@/types/product';

interface FilterSidebarProps {
  campos: CampoFiltro[];
  filtrosActivos: Record<string, string | number | null>;
  onFiltroChange: (nombre: string, valor: string | number | null) => void;
  onLimpiarFiltros: () => void;
  marcas: string[];
  opcionesDinamicas: Record<string, string[]>;
}

export default function FilterSidebar({ 
  campos, 
  filtrosActivos, 
  onFiltroChange, 
  onLimpiarFiltros, 
  marcas,
  opcionesDinamicas 
}: FilterSidebarProps) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});
  const [busquedas, setBusquedas] = useState<Record<string, string>>({});

  // Abrir todas las secciones por defecto o mantener su estado
  const toggleSeccion = (nombre: string) => {
    setSeccionesAbiertas((p) => {
      const isOculto = p[nombre] === false;
      return { ...p, [nombre]: !isOculto ? false : true };
    });
  };

  const handleSearchChange = (nombre: string, valor: string) => {
    setBusquedas(prev => ({ ...prev, [nombre]: valor }));
  };

  const tieneFiltros = Object.keys(filtrosActivos).length > 0;

  const isAbierta = (nombre: string) => seccionesAbiertas[nombre] !== false; // Abiertas por defecto

  const renderOpciones = (nombre: string, opciones: string[]) => {
    const q = (busquedas[nombre] || '').toLowerCase();
    const filtradas = opciones.filter(op => op.toLowerCase().includes(q));

    return (
      <div className="mt-2 flex flex-col gap-2">
        {opciones.length > 5 && (
          <div className="relative mb-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..."
              value={busquedas[nombre] || ''}
              onChange={(e) => handleSearchChange(nombre, e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {filtradas.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">Sin resultados</p>
          ) : (
            filtradas.map((op) => (
              <label key={op} className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 leading-tight">
                <input 
                  type="radio" 
                  name={nombre} 
                  checked={String(filtrosActivos[nombre]) === op} 
                  onChange={() => onFiltroChange(nombre, String(filtrosActivos[nombre]) === op ? null : op)} 
                  className="text-brand-600 mt-0.5" 
                />
                <span className="flex-1 break-words">{op}</span>
              </label>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-300" />
          <h2 className="font-semibold text-sm tracking-wide">FILTROS</h2>
        </div>
        {tieneFiltros && (
          <button onClick={onLimpiarFiltros} className="text-[10px] font-bold text-slate-300 hover:text-white uppercase tracking-wider bg-slate-800 px-2 py-1 rounded transition-colors">Limpiar</button>
        )}
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {/* Marca */}
        <div className="border-b border-slate-100 pb-4 mb-4">
          <button onClick={() => toggleSeccion('marca')} className="flex items-center justify-between w-full text-sm font-bold text-gray-800 py-1">
            <span>Marca</span>
            {isAbierta('marca') ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {isAbierta('marca') && renderOpciones('marca', marcas)}
        </div>

        {/* Dinámicos */}
        {campos.map((campo) => {
          // Siempre preferimos las opciones dinámicas (ya vienen filtradas en cascada)
          // Solo usamos las opciones estáticas de la categoría como fallback
          const opcionesBase = (opcionesDinamicas[campo.nombre] && opcionesDinamicas[campo.nombre].length > 0)
            ? opcionesDinamicas[campo.nombre]
            : (campo.opciones || []);
          
          if (opcionesBase.length === 0) return null; // No mostrar si no hay opciones en los productos actuales

          return (
            <div key={campo.nombre} className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
              <button onClick={() => toggleSeccion(campo.nombre)} className="flex items-center justify-between w-full text-sm font-bold text-gray-800 py-1">
                <span className="text-left">{campo.nombre.replace(/_/g, ' ')}{campo.unidad ? ` (${campo.unidad})` : ''}</span>
                {isAbierta(campo.nombre) ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
              </button>
              
              {isAbierta(campo.nombre) && renderOpciones(campo.nombre, opcionesBase)}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
