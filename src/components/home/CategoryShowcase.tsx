'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  id: string;
  nombre: string;
  imagen_url?: string;
}

interface Props {
  categories: Category[];
}

export default function CategoryShowcase({ categories }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!categories || categories.length === 0) return null;

  // Mostramos exactamente 8 categorías (2 filas x 4 columnas) cuando no está expandido
  const visibleCategories = isExpanded ? categories : categories.slice(0, 8);
  const hasMore = categories.length > 8;

  const getImageUrl = (cat: Category) => {
    if (cat.imagen_url) return cat.imagen_url;
    // Fallback automático por nombre
    const safeName = cat.nombre.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `/categorias/${safeName}.png`;
  };

  return (
    <section className="py-16 px-4 bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Nuestras Categorías</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Explora nuestro catálogo especializado de herramientas de corte, equipos de medición y suministros industriales.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {visibleCategories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}`}
              className="group relative flex flex-col bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-brand-500 rounded-xl overflow-hidden transition-all duration-300"
            >
              {/* Contenedor de Imagen */}
              <div className="aspect-square md:aspect-[4/3] w-full relative bg-slate-800 overflow-hidden flex items-center justify-center">
                <img 
                  src={getImageUrl(cat)} 
                  alt={cat.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Si falla la imagen por nombre, la ocultamos y mostramos el icono
                    e.currentTarget.style.display = 'none';
                    const iconContainer = e.currentTarget.nextElementSibling as HTMLElement;
                    if (iconContainer) iconContainer.style.display = 'flex';
                  }}
                />
                <div 
                  className="absolute inset-0 flex-col items-center justify-center text-slate-500 bg-slate-800/80"
                  style={{ display: cat.imagen_url ? 'none' : 'none' }} // Se activará por error de fallback
                  id={`fallback-${cat.id}`}
                >
                  <Package className="h-10 w-10 mb-2 opacity-50" />
                </div>
              </div>
              
              {/* Pie de tarjeta */}
              <div className="p-4 text-center border-t border-slate-700/50">
                <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">
                  {cat.nombre}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 hover:border-brand-500 text-slate-300 hover:text-white rounded-full transition-colors font-medium"
            >
              {isExpanded ? (
                <>Ver menos categorías <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Ver todas las categorías ({categories.length}) <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
