import * as XLSX from 'xlsx';

export interface ItemActualizacionPrecio {
  numero_parte: string;
  costo: number;
  moneda?: 'USD' | 'MXN' | null;
  filaOriginal: number;
}

export interface ParsePreciosResult {
  items: ItemActualizacionPrecio[];
  errores: string[];
  advertencias: string[];
}

function normalizarEncabezado(col: string): string {
  return col
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]/g, '');      // Solo letras y números
}

function parsearCostoSeguro(costoRaw: any, costoFmt: any): number | null {
  // Si la celda en Excel ya es numérica nativa, usar su valor exacto
  if (typeof costoRaw === 'number') {
    return Number.isFinite(costoRaw) ? costoRaw : null;
  }

  const origen = costoRaw !== null && costoRaw !== undefined ? String(costoRaw) : String(costoFmt ?? '');
  let str = origen.replace(/[$€£\s]/g, '').trim();
  if (!str) return null;

  const tieneComa = str.includes(',');
  const tienePunto = str.includes('.');

  if (tieneComa && tienePunto) {
    // El último separador que aparece define el decimal
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // Formato europeo: 1.250,50 -> 1250.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato estándar MX/US: 1,250.50 -> 1250.50
      str = str.replace(/,/g, '');
    }
  } else if (tieneComa && !tienePunto) {
    const partes = str.split(',');
    if (partes.length > 2) {
      // Múltiples comas de miles: 1,250,000 -> 1250000
      str = str.replace(/,/g, '');
    } else {
      const [entero, fraccion] = partes;
      // Si tiene 3 dígitos tras la coma y el entero no es "0" (ej. "1,250" o "12,500"), es separador de miles
      if (fraccion.length === 3 && entero !== '0' && entero !== '-0' && /^\d{1,3}$/.test(entero.replace(/^-/, ''))) {
        str = str.replace(',', '');
      } else {
        // Coma decimal tipo "4,85" o "0,125"
        str = str.replace(',', '.');
      }
    }
  }

  // Validar que la cadena limpia sea un número válido
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    return null;
  }

  const parsed = Number(str);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parsea un archivo Excel o CSV de actualización de precios con 3 columnas:
 * Columna 1: numero_parte
 * Columna 2: costo
 * Columna 3: moneda (USD / MXN o vacía para conservar)
 */
export function parsearExcelPrecios(fileBuffer: ArrayBuffer): ParsePreciosResult {
  const items: ItemActualizacionPrecio[] = [];
  const errores: string[] = [];
  const advertencias: string[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      errores.push('El archivo no contiene hojas de cálculo.');
      return { items, errores, advertencias };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Leemos tanto valores formateados (para preservar ceros a la izquierda en códigos) como valores crudos (para números exactos)
    const rowsFormatted = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null, raw: false });
    const rowsRaw = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null, raw: true });

    if (rowsFormatted.length === 0) {
      errores.push('El archivo está vacío o no contiene filas de datos.');
      return { items, errores, advertencias };
    }

    // Identificar columnas
    const sampleRow = rowsFormatted[0];
    const originalHeaders = Object.keys(sampleRow);

    let colParte: string | null = null;
    let colCosto: string | null = null;
    let colMoneda: string | null = null;

    originalHeaders.forEach((header) => {
      const norm = normalizarEncabezado(header);
      if (
        !colParte &&
        (norm === 'numeroparte' ||
          norm === 'noparte' ||
          norm === 'parte' ||
          norm === 'codigo' ||
          norm === 'sku' ||
          norm === 'skuinterno' ||
          norm === 'modelo')
      ) {
        colParte = header;
      } else if (
        !colCosto &&
        (norm === 'costo' ||
          norm === 'costobase' ||
          norm === 'nuevocosto' ||
          norm === 'precio' ||
          norm === 'costounitario' ||
          norm === 'importecosto')
      ) {
        colCosto = header;
      } else if (
        !colMoneda &&
        (norm === 'moneda' ||
          norm === 'monedacosto' ||
          norm === 'divisa' ||
          norm === 'currency')
      ) {
        colMoneda = header;
      }
    });

    // Fallback seguro: asignar por posición únicamente usando columnas que NO hayan sido ya asignadas
    const disponibles = originalHeaders.filter((h) => h !== colParte && h !== colCosto && h !== colMoneda);
    if (!colParte && disponibles.length > 0) colParte = disponibles.shift()!;
    if (!colCosto && disponibles.length > 0) colCosto = disponibles.shift()!;
    if (!colMoneda && disponibles.length > 0) colMoneda = disponibles.shift()!;

    if (!colParte || !colCosto || colParte === colCosto) {
      errores.push('No se pudieron identificar las columnas requeridas (numero_parte y costo).');
      return { items, errores, advertencias };
    }

    const setPartesVistas = new Set<string>();

    rowsFormatted.forEach((rowFmt, index) => {
      const rowRaw = rowsRaw[index] || rowFmt;
      const filaNum = index + 2; // +2 porque el índice es 0 y la fila 1 son encabezados
      const parteRaw = rowFmt[colParte!] ?? rowRaw[colParte!];
      const costoRaw = rowRaw[colCosto!];
      const costoFmt = rowFmt[colCosto!];
      const monedaRaw = colMoneda ? (rowFmt[colMoneda] ?? rowRaw[colMoneda]) : null;

      // Validar número de parte
      if (parteRaw === null || parteRaw === undefined || String(parteRaw).trim() === '') {
        return; // Fila vacía al final del archivo, ignorar
      }

      // Auto-Trim del código de parte
      const numeroParte = String(parteRaw).trim();

      // Validar y limpiar costo (manejo seguro de números nativos, miles y decimales)
      const costoNum = parsearCostoSeguro(costoRaw, costoFmt);

      if (costoNum === null || isNaN(costoNum)) {
        advertencias.push(`Fila ${filaNum}: El costo "${costoFmt ?? costoRaw ?? ''}" para "${numeroParte}" no es un número válido. Se omitió.`);
        return;
      }

      if (costoNum < 0) {
        advertencias.push(`Fila ${filaNum}: Costo negativo (${costoNum}) en "${numeroParte}". Se omitió.`);
        return;
      }

      // Validar moneda: si viene vacía se deja en null (para conservar la moneda actual del catálogo)
      let moneda: 'USD' | 'MXN' | null = null;
      if (monedaRaw !== null && monedaRaw !== undefined && String(monedaRaw).trim() !== '') {
        const monNorm = String(monedaRaw).trim().toUpperCase();
        if (monNorm.includes('MXN') || monNorm.includes('PESO') || monNorm === 'MN' || monNorm === 'M.N.') {
          moneda = 'MXN';
        } else if (monNorm.includes('USD') || monNorm.includes('DLL') || monNorm.includes('DOL') || monNorm === 'US$') {
          moneda = 'USD';
        } else {
          advertencias.push(`Fila ${filaNum}: Moneda no válida "${monedaRaw}" en "${numeroParte}". Solo se admite USD o MXN. Se omitió.`);
          return;
        }
      }

      // Desduplicar en el mismo archivo (conservar la primera aparición)
      const parteUpper = numeroParte.toUpperCase();
      if (setPartesVistas.has(parteUpper)) {
        advertencias.push(`Fila ${filaNum}: Código duplicado "${numeroParte}" en el archivo. Se procesará la primera aparición.`);
        return;
      }
      setPartesVistas.add(parteUpper);

      items.push({
        numero_parte: numeroParte,
        costo: costoNum,
        moneda,
        filaOriginal: filaNum,
      });
    });

    if (items.length === 0 && errores.length === 0) {
      errores.push('No se encontraron filas con datos válidos en el archivo.');
    }
  } catch (err: any) {
    errores.push(`Error al leer el archivo Excel: ${err.message || 'Formato no soportado'}`);
  }

  return { items, errores, advertencias };
}

/**
 * Genera la plantilla oficial descargable de 3 columnas para el usuario
 */
export function generarPlantillaPreciosExcel(): Blob {
  const encabezados = ['numero_parte', 'costo', 'moneda'];
  const datosEjemplo = [
    { numero_parte: 'APKT1003PDER-XM', costo: 4.85, moneda: 'USD' },
    { numero_parte: 'WNMG432-GM', costo: 7.90, moneda: 'USD' },
    { numero_parte: 'CNMG120408-PM', costo: 6.25, moneda: 'USD' },
    { numero_parte: 'BROCA-HSS-1/2', costo: 185.00, moneda: 'MXN' },
    { numero_parte: 'FRESA-CARBURO-4F-3/8', costo: 32.50, moneda: 'USD' },
  ];

  const ws = XLSX.utils.json_to_sheet(datosEjemplo, { header: encabezados });

  // Ancho de columnas para legibilidad
  ws['!cols'] = [
    { wch: 28 }, // numero_parte
    { wch: 14 }, // costo
    { wch: 12 }, // moneda
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PlantillaPrecios');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Exporta el reporte de salud de precios y antigüedad a Excel
 */
export function exportarReporteSaludExcel(
  productos: Array<{
    sku_interno: string;
    numero_parte: string;
    marca: string;
    categoria: string;
    costo_base: number;
    moneda_costo: string;
    costo_actualizado_at?: string;
    updated_at?: string;
    created_at?: string;
    diasSinActualizar: number;
    estadoSemaforo: 'al_dia' | 'vigencia_media' | 'en_riesgo';
    requiere_confirmacion?: boolean;
    tieneNotaConfirmacion?: boolean;
    activo: boolean;
  }>
): Blob {
  const filas = productos.map((p) => {
    let semaforoTexto = 'Al Día';
    if (p.estadoSemaforo === 'vigencia_media') semaforoTexto = 'Vigencia Media';
    if (p.estadoSemaforo === 'en_riesgo') semaforoTexto = 'En Riesgo';

    let visibilidadTexto = 'Activo';
    if (!p.activo) {
      visibilidadTexto = 'Desactivado (Oculto)';
    } else if (p.tieneNotaConfirmacion || p.requiere_confirmacion) {
      visibilidadTexto = 'Con Nota de Confirmación';
    }

    const fechaRaw = p.costo_actualizado_at || p.updated_at || p.created_at;
    const fechaFormateada = fechaRaw
      ? new Date(fechaRaw).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : 'Sin registro';

    return {
      'Serie / SKU Interno': p.sku_interno || '',
      'Número de Parte': p.numero_parte || '',
      'Marca': p.marca || '',
      'Categoría': p.categoria || '',
      'Costo Actual': p.costo_base || 0,
      'Moneda': p.moneda_costo || 'USD',
      'Última Actualización': fechaFormateada,
      'Días sin Actualizar': p.diasSinActualizar,
      'Semáforo': semaforoTexto,
      'Estado Catálogo': visibilidadTexto,
    };
  });

  const ws = XLSX.utils.json_to_sheet(filas);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SaludDePrecios');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Exporta el historial / bitácora de actualizaciones a Excel
 */
export function exportarBitacoraExcel(
  eventos: Array<{
    id: string;
    fecha: string;
    usuario: string;
    marca?: string;
    total_procesados: number;
    total_actualizados: number;
    total_no_encontrados: number;
    no_encontrados?: string[];
  }>
): Blob {
  const filas = eventos.map((e) => {
    const fechaFormateada = e.fecha
      ? new Date(e.fecha).toLocaleString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Sin fecha';

    return {
      'ID Registro': e.id,
      'Fecha y Hora': fechaFormateada,
      'Usuario / Admin': e.usuario,
      'Marca Asociada': e.marca || 'General',
      'Total Procesados': e.total_procesados,
      'Actualizados con Éxito': e.total_actualizados,
      'No Encontrados': e.total_no_encontrados,
      'Ejemplo No Encontrados': (e.no_encontrados || []).slice(0, 10).join(', '),
    };
  });

  const ws = XLSX.utils.json_to_sheet(filas);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BitacoraActualizaciones');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
