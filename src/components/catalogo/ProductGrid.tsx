import type { ProductoConPrecio } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  productos: ProductoConPrecio[];
  marcasLogos?: Record<string, string>;
}

export default function ProductGrid({ productos, marcasLogos = {} }: ProductGridProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No se encontraron productos.</p>
        <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} marcaLogoUrl={marcasLogos[producto.marca]} />
      ))}
    </div>
  );
}
