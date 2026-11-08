import { ProductoConPrecio, CampoFiltro } from '@/types/product';

/**
 * Detecta si un producto se vende en múltiplos o paquetes cerrados (ej. Cajas de 10 insertos).
 * Lee campos como "PIEZAS POR PAQUETE", "MULTIPLO DE VENTA", "MINIMO DE COMPRA", etc.
 */
export function obtenerMultiploVenta(producto?: Partial<ProductoConPrecio> | null): number {
  if (!producto || !producto.especificaciones_tecnicas) return 1;
  const specs = producto.especificaciones_tecnicas;

  const clavesPaquete = [
    'piezas por paquete',
    'piezas_por_paquete',
    'pzas por paquete',
    'piezas por caja',
    'cantidad por paquete',
    'cantidad por caja',
    'multiplo de venta',
    'múltiplo de venta',
    'minimo de compra',
    'mínimo de compra',
    'empaque',
    'paquete',
    'moq',
  ];

  for (const key of Object.keys(specs)) {
    const lowerKey = key.toLowerCase().trim();
    if (clavesPaquete.some((ck) => lowerKey === ck || lowerKey.includes(ck))) {
      const rawVal = String(specs[key] ?? '').trim();
      const match = rawVal.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > 1 && num <= 1000) {
          return num;
        }
      }
    }
  }

  return 1;
}

/**
 * Genera el encabezado estilo fabricante (Ej. "TPU 322 TiAlN Tracker (10 Pack)")
 * especialmente útil cuando el número de parte es un código EDP numérico (ej. 41694).
 */
export function obtenerEncabezadoComercialProducto(producto: ProductoConPrecio): {
  tituloPrincipal: string;
  subtituloComercial: string | null;
  badgeMaterial: string | null;
  codigoFabricante: string;
  multiplo: number;
} {
  const specs = producto.especificaciones_tecnicas || {};
  const multiplo = obtenerMultiploVenta(producto);

  const findSpec = (candidates: string[]): string | null => {
    let foundKey = Object.keys(specs).find((k) =>
      candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase())
    );
    if (!foundKey) {
      foundKey = Object.keys(specs).find((k) =>
        candidates.some((c) => k.toLowerCase().includes(c.toLowerCase()))
      );
    }
    if (!foundKey) return null;
    const val = String(specs[foundKey] ?? '').trim();
    if (!val || val.toUpperCase() === 'N/A' || val === '-') return null;
    return val;
  };

  const rawCategoria = (producto.categoria || '').toUpperCase();
  const esInserto = rawCategoria.includes('INSERTO');

  const ansi = findSpec(['designación ansi', 'designacion ansi', 'ansi', 'codigo ansi', 'código ansi']);
  const iso = findSpec(['designación iso', 'designacion iso', 'iso', 'codigo iso', 'código iso']);
  const recubrimiento = findSpec(['recubrimiento']);
  const gradoRaw = findSpec(['grado', 'familia', 'serie']);
  const material = findSpec(['material', 'substrato', 'sustrato']);
  const geometriaRaw = findSpec(['geometria', 'geometría', 'forma']);

  // Limpiar grado si viene como "TRACKER (GRADO BASE CM14)" -> "Tracker" para el título corto
  const gradoCorto = gradoRaw ? gradoRaw.split('(')[0].trim() : null;

  let badgeMaterial: string | null = null;
  if (material && gradoRaw) {
    badgeMaterial = `${material} • ${gradoRaw}`;
  } else if (material) {
    badgeMaterial = material;
  } else if (gradoRaw) {
    badgeMaterial = gradoRaw;
  }

  if (esInserto && (ansi || iso)) {
    const designacionBase = ansi || iso || producto.numero_parte;
    const partesTitulo: string[] = [designacionBase];

    if (recubrimiento && recubrimiento.toUpperCase() !== 'SIN RECUBRIMIENTO' && recubrimiento.toUpperCase() !== 'NO') {
      if (!designacionBase.toUpperCase().includes(recubrimiento.toUpperCase())) {
        partesTitulo.push(recubrimiento);
      }
    }

    if (gradoCorto && !designacionBase.toUpperCase().includes(gradoCorto.toUpperCase())) {
      partesTitulo.push(gradoCorto);
    }

    if (multiplo > 1) {
      partesTitulo.push(`(Paquete de ${multiplo} pzas)`);
    }

    const tituloPrincipal = partesTitulo.join(' ');

    // Construir subtítulo descriptivo limpio
    let geoLimpia = geometriaRaw || '';
    if (geoLimpia.includes('(')) {
      const matchParen = geoLimpia.match(/\(([^)]+)\)/);
      if (matchParen) geoLimpia = matchParen[1];
    }

    const subtituloComercial = geoLimpia
      ? `Inserto ${geoLimpia} de Precisión${iso && ansi ? ` • Norma ISO: ${iso}` : ''}`
      : `Inserto Indexable de Precisión${iso && ansi ? ` • Norma ISO: ${iso}` : ''}`;

    return {
      tituloPrincipal,
      subtituloComercial,
      badgeMaterial,
      codigoFabricante: producto.numero_parte,
      multiplo,
    };
  }

  return {
    tituloPrincipal: multiplo > 1 ? `${producto.numero_parte} (Paquete de ${multiplo} pzas)` : producto.numero_parte,
    subtituloComercial: null,
    badgeMaterial,
    codigoFabricante: producto.numero_parte,
    multiplo,
  };
}

export function formatearDescripcionProducto(
  producto: ProductoConPrecio,
  camposCategoriaOverride?: CampoFiltro[]
): string {
  const rawSpecs = producto.especificaciones_tecnicas || {};
  const camposCat = camposCategoriaOverride || producto._campos_categoria;

  // Si la categoría tiene campos configurados en Admin -> Categorías, ignorar
  // cualquier llave vieja/fantasma que no pertenezca a la categoría actual
  let specs: Record<string, any> = rawSpecs;
  if (camposCat && Array.isArray(camposCat) && camposCat.length > 0) {
    const permitidos = new Set(camposCat.map((c) => c.nombre.toUpperCase().trim()));
    specs = {};
    for (const [k, v] of Object.entries(rawSpecs)) {
      if (permitidos.has(k.toUpperCase().trim())) {
        specs[k] = v;
      }
    }
  }

  const usedKeys = new Set<string>();
  const rawCategoria = (producto.categoria || '').toUpperCase();

  // ---------------------------------------------------------------------------
  // LOGICA 0: CONFIGURACIÓN PERSONALIZADA DESDE ADMIN -> CATEGORÍAS
  // Si el administrador seleccionó qué campos mostrar en la descripción
  // (`visible_en_descripcion === true`), se arma siguiendo ese orden y formato.
  // ---------------------------------------------------------------------------
  if (camposCat && Array.isArray(camposCat)) {
    const camposActivosDesc = camposCat.filter((c) => c.visible_en_descripcion === true);
    if (camposActivosDesc.length > 0) {
      const partesCustom: string[] = [];

      // Nombre base de la categoría en singular o limpio
      let prefijoCat = rawCategoria;
      if (rawCategoria === 'INSERTOS') prefijoCat = 'INSERTO';
      else if (rawCategoria === 'ENDMILLS') prefijoCat = 'CORTADOR';
      else if (rawCategoria === 'BROCAS') prefijoCat = 'BROCA';
      if (prefijoCat) partesCustom.push(prefijoCat);

      for (const campo of camposActivosDesc) {
        const foundKey = Object.keys(specs).find(
          (k) => k.toLowerCase().trim() === campo.nombre.toLowerCase().trim()
        );
        if (!foundKey) continue;
        let val = String(specs[foundKey] ?? '').trim();
        if (!val || val.toUpperCase() === 'N/A' || val === '-') continue;

        if (campo.sufijo && !val.toLowerCase().endsWith(campo.sufijo.toLowerCase())) {
          val = `${val}${campo.sufijo}`;
        }

        const formato = campo.formato_descripcion || 'valor';
        if (formato === 'etiqueta') {
          partesCustom.push(`${campo.nombre}: ${val}`);
        } else if (formato === 'prefijo' && campo.prefijo_descripcion) {
          partesCustom.push(`${campo.prefijo_descripcion.trim()} ${val}`);
        } else {
          partesCustom.push(val);
        }
      }

      const multiplo = obtenerMultiploVenta(producto);
      if (multiplo > 1 && !partesCustom.some((p) => p.toUpperCase().includes('PAQUETE') || p.toUpperCase().includes('CAJA'))) {
        partesCustom.push(`(CAJA C/${multiplo} PZAS)`);
      }

      if (partesCustom.length > 1) {
        return partesCustom.join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
      }
    }
  }
  
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
  // LOGICA 4: INSERTOS (Torneado / Fresado / Roscado)
  // Replica el estilo limpio de fabricantes como Cobra Carbide:
  // Ej: "INSERTO DE CARBURO TRIANGULAR TPU 322 (ISO TPUN 160308) TIALN TRACKER, I.C. 3/8" X ESP. 1/8" X R 1/32", 11° POSITIVO (CAJA C/10 PZAS)"
  // ----------------------------------------------------
  if (rawCategoria.includes('INSERTO')) {
    const material = getSpec(['material', 'substrato', 'sustrato']);
    const geometriaRaw = getSpec(['geometria', 'geometría', 'forma', 'forma geométrica']);
    const ansi = getSpec(['designación ansi', 'designacion ansi', 'ansi', 'codigo ansi']);
    const iso = getSpec(['designación iso', 'designacion iso', 'iso', 'codigo iso']);
    const recubrimiento = getSpec(['recubrimiento']);
    const gradoRaw = getSpec(['grado', 'familia', 'serie']);
    const circuloInscrito = getSpec(['círculo inscrito (i.c.)', 'circulo inscrito (i.c.)', 'círculo inscrito', 'circulo inscrito', 'i.c.', 'ic']);
    const espesor = getSpec(['espesor', 'espesor (s)', 'thickness']);
    const radio = getSpec(['radio de punta', 'radio', 'corner radius']);
    const angulo = getSpec(['ángulo de desahogo (relief)', 'angulo de desahogo', 'ángulo de desahogo', 'relief']);
    const multiplo = obtenerMultiploVenta(producto);

    const partesPrincipales: string[] = ['INSERTO'];

    if (material) {
      partesPrincipales.push(material.toUpperCase().startsWith('DE ') ? material : `DE ${material}`);
    }

    if (geometriaRaw) {
      // Si dice "T (TRIANGULAR)", extraer "TRIANGULAR" para lectura natural
      const matchParen = geometriaRaw.match(/\(([^)]+)\)/);
      const geoLimpia = matchParen ? matchParen[1].trim() : geometriaRaw.trim();
      partesPrincipales.push(geoLimpia);
    }

    if (ansi) partesPrincipales.push(ansi);
    if (iso && (!ansi || ansi.toUpperCase() !== iso.toUpperCase())) {
      partesPrincipales.push(`(ISO ${iso})`);
    }

    if (recubrimiento && recubrimiento.toUpperCase() !== 'SIN RECUBRIMIENTO' && recubrimiento.toUpperCase() !== 'NO') {
      partesPrincipales.push(recubrimiento);
    }

    if (gradoRaw) {
      const gradoCorto = gradoRaw.split('(')[0].trim();
      if (gradoCorto) {
        partesPrincipales.push(gradoCorto.toUpperCase().startsWith('GRADO') ? gradoCorto : `GRADO ${gradoCorto}`);
      }
    }

    const medidas: string[] = [];
    if (circuloInscrito) medidas.push(`I.C. ${formatDimension(circuloInscrito)}`);
    if (espesor) medidas.push(`ESP. ${formatDimension(espesor)}`);
    if (radio) {
      const rClean = radio.toUpperCase().startsWith('R') ? radio : `R ${radio}`;
      medidas.push(formatDimension(rClean));
    }

    let resultado = partesPrincipales.join(' ');
    if (medidas.length > 0) {
      resultado += ` — ${medidas.join(' X ')}`;
    }
    if (angulo) {
      resultado += `, ${angulo.includes('°') ? angulo : `${angulo}°`}`;
    }
    if (multiplo > 1) {
      resultado += ` (PAQUETE DE ${multiplo} PZAS)`;
    }

    return resultado.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 5: PORTAHERRAMIENTAS
  // Ej: "PORTAHERRAMIENTAS CAT40 ER32 LARGO 3.2""
  // ----------------------------------------------------
  if (rawCategoria.includes('PORTAHERRAMIENTA')) {
    const cono = getSpec(['cono', 'tipo de cono']);
    const sujecion = getSpec(['sujecion', 'sujeción', 'tipo de sujecion', 'tipo de sujeción', 'boquilla', 'sistema']);
    const largo = getSpec(['largo', 'longitud', 'proyeccion', 'proyección']);
    const diametro = getSpec(['diametro', 'diámetro', 'capacidad']);
    const balanceo = getSpec(['balanceo', 'rpm']);
    const refrigerante = getSpec(['refrigerante']);

    const partes: string[] = ['PORTAHERRAMIENTAS'];
    if (cono) partes.push(cono);
    if (sujecion) partes.push(sujecion);
    if (diametro) partes.push(formatDimension(diametro));
    if (largo) partes.push(`LARGO ${formatDimension(largo)}`);
    if (balanceo) partes.push(balanceo);
    if (refrigerante && ['SI', 'SÍ', 'YES', 'AD', 'AD/B'].includes(refrigerante.toUpperCase())) {
      partes.push('C/REFRIGERANTE');
    }

    return partes.join(' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // ----------------------------------------------------
  // LOGICA 6: MOTOR GENERICO LIMPIO
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
  if (recubrimiento && recubrimiento.toUpperCase() !== 'SIN RECUBRIMIENTO' && recubrimiento.toUpperCase() !== 'NO') {
    partes.push(recubrimiento);
  }

  let baseText = partes.join(' ').toUpperCase();

  // Recolectar hasta 4 atributos principales sin saturar con '|'
  const extras: string[] = [];
  for (const [key, val] of Object.entries(specs)) {
    if (key.toLowerCase() === 'requiere_confirmacion') continue;
    if (key.toLowerCase().includes('piezas por paquete')) continue;
    if (!usedKeys.has(key)) {
      const cleanVal = String(val).trim();
      if (cleanVal && cleanVal.toUpperCase() !== 'N/A' && cleanVal !== '-') {
        extras.push(`${key}: ${cleanVal}`);
      }
    }
    if (extras.length >= 4) break;
  }

  if (extras.length > 0) {
    baseText += ` — ${extras.join(', ')}`;
  }

  const multiplo = obtenerMultiploVenta(producto);
  if (multiplo > 1) {
    baseText += ` (PAQUETE DE ${multiplo} PZAS)`;
  }

  return baseText.toUpperCase();
}
