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
    const material = getSpec(['material de broca', 'material de la broca', 'material']);
    const materialPunta = getSpec(['material de punta', 'material de la punta']);
    const recubrimiento = getSpec(['recubrimiento']);
    const largoFlauta = getSpec(['flauta (l1)', 'largo flauta', 'corte (l1)', 'l1']);
    const largoTotal = getSpec(['largo (l)', 'largo total', 'longitud total']);
    const anguloPunta = getSpec(['angulo de punta (a1)', 'ángulo de punta (a1)', 'angulo de punta', 'ángulo de punta', 'a1', 'angulo']);
    const anguloA2 = getSpec(['angulo (a2)', 'ángulo (a2)', 'a2']);

    const partes: string[] = [];
    if (tipo && tipo.toUpperCase().includes('BROCA')) {
      partes.push(tipo);
    } else {
      partes.push('BROCA');
      if (tipo) partes.push(tipo);
    }

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

    if (anguloPunta) {
      partes.push(anguloPunta.includes('°') ? anguloPunta : `${anguloPunta}°`);
    }
    if (anguloA2) {
      partes.push(anguloA2.includes('°') ? anguloA2 : `${anguloA2}°`);
    }

    if (corteXD) partes.push(corteXD.toLowerCase().includes('xd') ? corteXD : `${corteXD}xD`);

    let finalMaterialStr = '';
    if (material && materialPunta) {
      if (material.toUpperCase() === materialPunta.toUpperCase()) {
        finalMaterialStr = material;
      } else {
        finalMaterialStr = `MATERIAL DE PUNTA: ${materialPunta}`;
      }
    } else if (materialPunta) {
      finalMaterialStr = `MATERIAL DE PUNTA: ${materialPunta}`;
    } else if (material) {
      finalMaterialStr = material;
    }

    if (finalMaterialStr) {
      partes.push(finalMaterialStr);
    }
    if (recubrimiento) partes.push(recubrimiento);
    
    if (refrigerante && (refrigerante.toUpperCase() === 'SI' || refrigerante.toUpperCase() === 'YES' || refrigerante.toUpperCase() === 'CON REFRIGERANTE')) {
      partes.push('C/REFRIGERANTE');
    }

    return partes.join(' ').toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 3: INSTRUMENTOS DE MEDICIÓN
  // Orden: Tipo de instrumento, Tipo, Rango, Salida de datos,
  // Certificado de calibración, Resistencia, Característica.
  // (El resto de specs se consulta en la tabla técnica del producto.)
  // ----------------------------------------------------
  const categoriaNorm = rawCategoria.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esMedicion =
    categoriaNorm.includes('MEDICION') ||
    categoriaNorm.includes('METROLOG') ||
    Object.keys(specs).some((k) => k.toLowerCase().includes('tipo de instrumento'));

  if (esMedicion) {
    // Variante de getSpec que nunca reutiliza una llave ya leída
    // (evita que "tipo" vuelva a tomar "tipo de instrumento").
    const getSpecMed = (keys: string[], permitirParcial = true): { key: string; val: string } | null => {
      const disponibles = Object.keys(specs).filter((k) => !usedKeys.has(k) && k.toLowerCase() !== 'requiere_confirmacion');
      let foundKey = disponibles.find((k) => keys.some((s) => k.toLowerCase().trim() === s.toLowerCase()));
      if (!foundKey && permitirParcial) {
        foundKey = disponibles.find((k) => keys.some((s) => k.toLowerCase().includes(s.toLowerCase())));
      }
      if (!foundKey) return null;
      usedKeys.add(foundKey);
      const val = String(specs[foundKey] ?? '').trim();
      if (!val || val.toUpperCase() === 'N/A' || val === '-') return null;
      return { key: foundKey, val };
    };

    const esSi = (v: string) => ['SI', 'SÍ', 'YES', 'TRUE', '1', 'CON'].includes(v.trim().toUpperCase());
    const esNo = (v: string) => ['NO', 'FALSE', '0', 'SIN', 'NINGUNA', 'NINGUNO'].includes(v.trim().toUpperCase());

    const tipoInstrumento = getSpecMed(['tipo de instrumento', 'instrumento']);
    const tipo = getSpecMed(['tipo'], false);
    const rango = getSpecMed(['rango', 'capacidad']);
    const salidaDatos = getSpecMed(['salida de datos', 'salida']);
    const certificado = getSpecMed(['certificado', 'calibracion', 'calibración', 'nist']);
    const resistencia =
      getSpecMed(['resistencia', 'proteccion', 'protección']) ||
      getSpecMed(['ip', 'grado ip', 'clasificacion ip', 'clasificación ip'], false);
    const caracteristica = getSpecMed(['caracteristica', 'característica', 'caracteristicas', 'características']);

    const partes: string[] = [];

    const nombreInstrumento = tipoInstrumento?.val || 'INSTRUMENTO DE MEDICIÓN';
    partes.push(nombreInstrumento);

    // Evitar duplicar si el "tipo" ya viene dentro del nombre (ej. "VERNIER DIGITAL" + "DIGITAL")
    if (tipo && !nombreInstrumento.toUpperCase().includes(tipo.val.toUpperCase())) {
      partes.push(tipo.val);
    }

    if (rango) partes.push(rango.val);

    if (salidaDatos && !esNo(salidaDatos.val)) {
      partes.push(esSi(salidaDatos.val) ? 'C/SALIDA DE DATOS' : `SALIDA DE DATOS ${salidaDatos.val}`);
    }

    if (certificado && !esNo(certificado.val)) {
      if (esSi(certificado.val)) {
        partes.push(certificado.key.toUpperCase().includes('NIST') ? 'C/CERTIFICADO NIST' : 'C/CERTIFICADO DE CALIBRACIÓN');
      } else {
        partes.push(`CERTIFICADO ${certificado.val}`);
      }
    }

    if (resistencia && !esNo(resistencia.val)) {
      // "SI" -> se usa el nombre del campo (ej. "RESISTENCIA AL AGUA"); otro valor -> el valor (ej. "IP67")
      partes.push(esSi(resistencia.val) ? resistencia.key : resistencia.val);
    }

    if (caracteristica && !esNo(caracteristica.val)) {
      partes.push(caracteristica.val);
    }

    return partes.join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 4: MOTOR GENERICO (Insertos, etc.)
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

  // Recolectar atributos que no fueron usados arriba y añadirlos al final (ignorando llaves internas)
  const extras: string[] = [];
  for (const [key, val] of Object.entries(specs)) {
    if (key.toLowerCase() === 'requiere_confirmacion') continue;
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
