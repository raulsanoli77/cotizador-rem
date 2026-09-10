import type { ProductoConPrecio } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  productos: ProductoConPrecio[];
}

export default function ProductGrid({ productos }: ProductGridProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No se encontraron productos.</p>
        <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} />
      ))}
    </div>
  );
}
