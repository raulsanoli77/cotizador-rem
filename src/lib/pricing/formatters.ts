import { ProductoConPrecio } from '@/types/product';

export function formatearDescripcionProducto(producto: ProductoConPrecio): string {
  const specs = producto.especificaciones_tecnicas || {};
  
  // Función auxiliar para extraer ignorando N/A y guiones
  const getSpec = (keys: string[]) => {
    const foundKey = Object.keys(specs).find(k => 
      keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase()))
    );
    if (!foundKey) return null;
    const val = String(specs[foundKey]).trim();
    if (val.toUpperCase() === 'N/A' || val === '-') return null;
    return val;
  };

  // 1. Categoría
  let categoriaStr = producto.categoria || '';
  if (categoriaStr.toLowerCase().includes('endmill')) {
    categoriaStr = 'CORTADOR';
  }

  // Extraer valores limpios
  const diametro = getSpec(['diametro', 'diámetro']);
  const filos = getSpec(['filo', 'flauta']);
  const material = getSpec(['material']);
  const recubrimiento = getSpec(['recubrimiento']);
  const radio = getSpec(['radio']);
  const chaflan = getSpec(['chaflan', 'chaflán']);
  const tipoDeFilo = getSpec(['tipo de filo']);
  const tipoDeCortador = getSpec(['tipo de cortador']);
  const largoCorte = getSpec(['largo de corte', 'longitud de corte', 'corte (l1)']);
  const largoTotal = getSpec(['largo total', 'longitud total', 'largo (l)']);

  // 2. Ensamblar partes
  const partes: string[] = [];
  
  if (categoriaStr) partes.push(categoriaStr);
  
  if (tipoDeFilo && tipoDeFilo.toUpperCase() !== 'CUADRADO') {
    partes.push(tipoDeFilo);
  }

  if (tipoDeCortador && tipoDeCortador.toUpperCase() !== 'USO GENERAL') {
    partes.push(tipoDeCortador);
  }

  if (diametro) {
    const dSuffix = (diametro.endsWith('"') || diametro.toLowerCase().endsWith('mm')) ? '' : '"';
    partes.push(`${diametro}${dSuffix}`);
  }
  
  if (filos) {
    const fSuffix = filos.toUpperCase().includes('FL') ? '' : 'FL';
    partes.push(`${filos}${fSuffix}`);
  }
  
  if (material) partes.push(material);
  if (recubrimiento) partes.push(recubrimiento);
  if (radio) partes.push(radio.toUpperCase().startsWith('R') ? radio : `R ${radio}`);
  if (chaflan) partes.push(chaflan.toUpperCase().startsWith('CH') ? chaflan : `CH ${chaflan}`);
  
  // Largos
  const largos: string[] = [];
  if (largoCorte) {
    const suffix = (largoCorte.endsWith('"') || largoCorte.toLowerCase().endsWith('mm')) ? '' : '"';
    largos.push(`${largoCorte}${suffix} CORTE`);
  }
  if (largoTotal) {
    const suffix = (largoTotal.endsWith('"') || largoTotal.toLowerCase().endsWith('mm')) ? '' : '"';
    largos.push(`${largoTotal}${suffix} LARGO`);
  }

  // Unir todo
  let descripcionFinal = partes.join(' ');
  if (largos.length > 0) {
    descripcionFinal += `, ${largos.join(', ')}`;
  }

  return descripcionFinal.toUpperCase();
}
