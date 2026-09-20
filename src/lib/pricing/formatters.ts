import { ProductoConPrecio } from '@/types/product';

export function formatearDescripcionProducto(producto: ProductoConPrecio): string {
  const specs = producto.especificaciones_tecnicas || {};
  const usedKeys = new Set<string>();
  
  // Función auxiliar para extraer ignorando N/A y guiones, y registrar la llave usada
  const getSpec = (keys: string[]) => {
    const foundKey = Object.keys(specs).find(k => 
      keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase()))
    );
    if (!foundKey) return null;
    
    usedKeys.add(foundKey);
    const val = String(specs[foundKey]).trim();
    if (val.toUpperCase() === 'N/A' || val === '-') return null;
    return val;
  };

  const rawCategoria = (producto.categoria || '').toUpperCase();

  // ----------------------------------------------------
  // LOGICA 1: ENDMILLS
  // ----------------------------------------------------
  if (rawCategoria.includes('ENDMILL')) {
    let categoriaStr = 'CORTADOR';
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

    const partes: string[] = [categoriaStr];
    
    if (tipoDeFilo && tipoDeFilo.toUpperCase() === 'BOLA') partes.push(tipoDeFilo);
    if (tipoDeCortador && tipoDeCortador.toUpperCase() !== 'USO GENERAL') partes.push(tipoDeCortador);
    
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
    
    const largos: string[] = [];
    if (largoCorte) {
      const suffix = (largoCorte.endsWith('"') || largoCorte.toLowerCase().endsWith('mm')) ? '' : '"';
      largos.push(`${largoCorte}${suffix} CORTE`);
    }
    if (largoTotal) {
      const suffix = (largoTotal.endsWith('"') || largoTotal.toLowerCase().endsWith('mm')) ? '' : '"';
      largos.push(`${largoTotal}${suffix} LARGO`);
    }

    let descripcionFinal = partes.join(' ');
    if (largos.length > 0) {
      descripcionFinal += `, ${largos.join(', ')}`;
    }
    return descripcionFinal.toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 2: BROCAS
  // ----------------------------------------------------
  if (rawCategoria.includes('BROCA')) {
    const diametro = getSpec(['diametro', 'diámetro']);
    const tipo = getSpec(['tipo']);
    const corteXD = getSpec(['corte (xd)', 'xd']);
    const refrigerante = getSpec(['refrigerante']);
    const material = getSpec(['material']);
    const recubrimiento = getSpec(['recubrimiento']);

    const partes: string[] = ['BROCA'];
    if (tipo) partes.push(tipo);
    if (diametro) {
      const dSuffix = (diametro.endsWith('"') || diametro.toLowerCase().endsWith('mm')) ? '' : '"';
      partes.push(`${diametro}${dSuffix}`);
    }
    if (corteXD) partes.push(corteXD.toLowerCase().includes('xd') ? corteXD : `${corteXD}xD`);
    if (material) partes.push(material);
    if (recubrimiento) partes.push(recubrimiento);
    if (refrigerante && (refrigerante.toUpperCase() === 'SI' || refrigerante.toUpperCase() === 'YES')) {
      partes.push('C/REFRIGERANTE');
    }

    return partes.join(' ').toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 3: MOTOR GENERICO (Insertos, Medición, etc.)
  // ----------------------------------------------------
  let categoriaStr = rawCategoria || 'HERRAMIENTA';
  const diametro = getSpec(['diametro', 'diámetro']);
  const material = getSpec(['material']);
  const recubrimiento = getSpec(['recubrimiento']);

  const partes = [categoriaStr];
  if (diametro) {
    const dSuffix = (diametro.endsWith('"') || diametro.toLowerCase().endsWith('mm')) ? '' : '"';
    partes.push(`${diametro}${dSuffix}`);
  }
  if (material) partes.push(material);
  if (recubrimiento) partes.push(recubrimiento);

  let baseText = partes.join(' ').toUpperCase();

  // Recolectar atributos que no fueron usados arriba y añadirlos al final
  const extras: string[] = [];
  for (const [key, val] of Object.entries(specs)) {
    if (!usedKeys.has(key)) {
      const cleanVal = String(val).trim();
      if (cleanVal.toUpperCase() !== 'N/A' && cleanVal !== '-') {
        // Ignoramos campos vacíos
        if (cleanVal) extras.push(`${key}: ${cleanVal}`);
      }
    }
  }

  if (extras.length > 0) {
    baseText += ` | ${extras.join(' | ')}`;
  }

  return baseText.toUpperCase();
}
