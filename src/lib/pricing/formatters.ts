import { ProductoConPrecio } from '@/types/product';

export function formatearDescripcionProducto(producto: ProductoConPrecio): string {
  const specs = producto.especificaciones_tecnicas || {};
  
  // Función auxiliar para buscar una llave sin importar mayúsculas/minúsculas
  const getSpec = (keys: string[]) => {
    const foundKey = Object.keys(specs).find(k => 
      keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase()))
    );
    return foundKey ? String(specs[foundKey]) : null;
  };

  // 1. Categoría
  let categoriaStr = producto.categoria || '';
  if (categoriaStr.toLowerCase().includes('endmill')) {
    categoriaStr = 'CORTADOR';
  }

  // Extraer valores
  const diametro = getSpec(['diametro', 'diámetro']);
  const filos = getSpec(['filo', 'flauta']);
  const material = getSpec(['material']);
  const recubrimiento = getSpec(['recubrimiento']);
  const radio = getSpec(['radio']);
  const largoCorte = getSpec(['largo de corte', 'longitud de corte']);
  const largoTotal = getSpec(['largo total', 'longitud total']);

  // 2. Ensamblar partes
  const partes: string[] = [];
  
  if (categoriaStr) partes.push(categoriaStr);
  if (diametro) partes.push(`${diametro}"`);
  if (filos) partes.push(`${filos}FL`);
  if (material) partes.push(material);
  if (recubrimiento) partes.push(recubrimiento);
  if (radio) partes.push(`R ${radio.replace(/^r\s*/i, '')}`); // Evitar duplicar la 'R' si ya venía
  
  // Largos con comas
  const largos: string[] = [];
  if (largoCorte) largos.push(`${largoCorte}" CORTE`);
  if (largoTotal) largos.push(`${largoTotal}" LARGO`);

  // Unir todo
  let descripcionFinal = partes.join(' ');
  if (largos.length > 0) {
    descripcionFinal += `, ${largos.join(', ')}`;
  }

  return descripcionFinal.toUpperCase();
}
