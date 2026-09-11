'use client';

interface BrandShowcaseProps {
  marcas: Record<string, string>;
}

export default function BrandShowcase({ marcas }: BrandShowcaseProps) {
  const marcasList = Object.entries(marcas || {}).sort(([a], [b]) => a.localeCompare(b));

  if (marcasList.length === 0) return null;

  return (
    <section className="bg-white py-16 px-4 border-t border-slate-200">
      <div className="container mx-auto max-w-6xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Nuestras Marcas</h2>
        <p className="text-slate-500 mb-10 max-w-2xl mx-auto">
          Distribuimos productos de la más alta calidad y representamos a las marcas líderes en la industria.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {marcasList.map(([marca, url]) => (
            <div 
              key={marca} 
              className="w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center p-4"
              title={marca}
            >
              <img 
                src={url} 
                alt={`Logo ${marca}`} 
                className="max-h-full max-w-full object-contain mix-blend-multiply" 
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
