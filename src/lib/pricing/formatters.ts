import { ProductoConPrecio } from '@/types/product';

export function formatearDescripcionProducto(producto: ProductoConPrecio): string {
  const specs = producto.especificaciones_tecnicas || {};
  const usedKeys = new Set<string>();
  
  // Función auxiliar para extraer ignorando N/A y guiones, y registrar la llave usada
  const getSpec = (keys: string[]) => {
    // 1. Intentar match exacto (case-insensitive)
    let foundKey = Object.keys(specs).find(k => 
      keys.some(searchKey => k.toLowerCase() === searchKey.toLowerCase())
    );
    
    // 2. Si no, match parcial (includes)
    if (!foundKey) {
      foundKey = Object.keys(specs).find(k => 
        keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase()))
      );
    }
    
    if (!foundKey) return null;
    
    usedKeys.add(foundKey);
    let val = String(specs[foundKey]).trim();
    if (val.toUpperCase() === 'N/A' || val === '-') return null;

    // Sanitize wire/letter drill sizes (e.g., #1" -> #1, H" -> H)
    if ((val.startsWith('#') || /^[A-Za-z]"$/.test(val)) && val.endsWith('"')) {
      val = val.slice(0, -1);
    }

    return val;
  };

  // Helper para agragar comillas de pulgadas solo si es pertinente
  const formatDimension = (val: string) => {
    if (!val) return '';
    if (val.endsWith('"') || val.toLowerCase().endsWith('mm') || val.startsWith('#') || /^[A-Za-z]$/.test(val)) {
      return val;
    }
    return `${val}"`;
  };

  const rawCategoria = (producto.categoria || '').toUpperCase();

  // ----------------------------------------------------
  // LOGICA 1: ENDMILLS
  // ----------------------------------------------------
  if (rawCategoria.includes('ENDMILL')) {
    let categoriaStr = 'CORTADOR';
    const diametro = getSpec(['diametro (d1)', 'diametro', 'diámetro']);
    const filos = getSpec(['filos', 'flautas']);
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
      partes.push(formatDimension(diametro));
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
      largos.push(`${formatDimension(largoCorte)} CORTE`);
    }
    if (largoTotal) {
      largos.push(`${formatDimension(largoTotal)} LARGO`);
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
    const diametro = getSpec(['diametro (d1)', 'diámetro', 'diametro']);
    const tipo = getSpec(['tipo']);
    const corteXD = getSpec(['corte (xd)', 'xd']);
    const refrigerante = getSpec(['refrigerante']);
    const material = getSpec(['material']);
    const recubrimiento = getSpec(['recubrimiento']);
    const largoFlauta = getSpec(['flauta (l1)', 'largo flauta', 'corte (l1)', 'l1']);
    const largoTotal = getSpec(['largo (l)', 'largo total', 'longitud total']);

    const partes: string[] = ['BROCA'];
    if (tipo) partes.push(tipo);

    const medidas: string[] = [];
    if (diametro) {
      medidas.push(formatDimension(diametro));
    }
    if (largoFlauta) {
      medidas.push(formatDimension(largoFlauta));
    }
    if (largoTotal) {
      medidas.push(formatDimension(largoTotal));
    }

    if (medidas.length > 0) {
      partes.push(medidas.join(' X '));
    }

    if (corteXD) partes.push(corteXD.toLowerCase().includes('xd') ? corteXD : `${corteXD}xD`);
    if (material) partes.push(material);
    if (recubrimiento) partes.push(recubrimiento);
    
    if (refrigerante && (refrigerante.toUpperCase() === 'SI' || refrigerante.toUpperCase() === 'YES' || refrigerante.toUpperCase() === 'CON REFRIGERANTE')) {
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
    partes.push(formatDimension(diametro));
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
