import * as XLSX from 'xlsx';

export interface ItemActualizacionPrecio {
  numero_parte: string;
  costo: number;
  moneda: 'USD' | 'MXN';
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

/**
 * Parsea un archivo Excel o CSV de actualización de precios con 3 columnas:
 * Columna 1: numero_parte
 * Columna 2: costo
 * Columna 3: moneda (USD / MXN)
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
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

    if (rows.length === 0) {
      errores.push('El archivo está vacío o no contiene filas de datos.');
      return { items, errores, advertencias };
    }

    // Identificar columnas
    const sampleRow = rows[0];
    const originalHeaders = Object.keys(sampleRow);

    let colParte: string | null = null;
    let colCosto: string | null = null;
    let colMoneda: string | null = null;

    originalHeaders.forEach((header) => {
      const norm = normalizarEncabezado(header);
      if (
        norm === 'numeroparte' ||
        norm === 'noparte' ||
        norm === 'parte' ||
        norm === 'codigo' ||
        norm === 'sku' ||
        norm === 'skuinterno'
      ) {
        colParte = header;
      } else if (
        norm === 'costo' ||
        norm === 'costobase' ||
        norm === 'nuevocosto' ||
        norm === 'precio' ||
        norm === 'costounitario'
      ) {
        colCosto = header;
      } else if (
        norm === 'moneda' ||
        norm === 'monedacosto' ||
        norm === 'divisa' ||
        norm === 'currency'
      ) {
        colMoneda = header;
      }
    });

    // Fallback: si no coinciden por nombre, usar posición (Columna 0 = Parte, 1 = Costo, 2 = Moneda)
    if (!colParte && originalHeaders.length >= 1) colParte = originalHeaders[0];
    if (!colCosto && originalHeaders.length >= 2) colCosto = originalHeaders[1];
    if (!colMoneda && originalHeaders.length >= 3) colMoneda = originalHeaders[2];

    if (!colParte || !colCosto) {
      errores.push('No se pudieron identificar las columnas requeridas (numero_parte y costo).');
      return { items, errores, advertencias };
    }

    const setPartesVistas = new Set<string>();

    rows.forEach((row, index) => {
      const filaNum = index + 2; // +2 porque el índice es 0 y la fila 1 son encabezados
      const parteRaw = row[colParte!];
      const costoRaw = row[colCosto!];
      const monedaRaw = colMoneda ? row[colMoneda] : null;

      // Validar número de parte
      if (parteRaw === null || parteRaw === undefined || String(parteRaw).trim() === '') {
        // Fila vacía al final del archivo, la ignoramos silenciosamente
        return;
      }

      // Auto-Trim y normalización del código de parte
      const numeroParte = String(parteRaw).trim();

      // Validar costo
      let costoNum: number | null = null;
      if (typeof costoRaw === 'number') {
        costoNum = costoRaw;
      } else if (typeof costoRaw === 'string') {
        // Limpiar signos de dólar, comas, espacios
        const limpio = costoRaw.replace(/[$,\s]/g, '').trim();
        const parsed = parseFloat(limpio);
        if (!isNaN(parsed)) costoNum = parsed;
      }

      if (costoNum === null || isNaN(costoNum)) {
        advertencias.push(`Fila ${filaNum}: El costo para "${numeroParte}" no es un número válido. Se omitió.`);
        return;
      }

      if (costoNum < 0) {
        advertencias.push(`Fila ${filaNum}: Costo negativo (${costoNum}) en "${numeroParte}". Se omitió.`);
        return;
      }

      // Validar moneda
      let moneda: 'USD' | 'MXN' = 'USD';
      if (monedaRaw) {
        const monNorm = String(monedaRaw).trim().toUpperCase();
        if (monNorm.includes('MXN') || monNorm.includes('PESO')) {
          moneda = 'MXN';
        } else {
          moneda = 'USD';
        }
      }

      // Desduplicar en el mismo archivo (conservar la última o primera)
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
    updated_at: string;
    diasSinActualizar: number;
    estadoSemaforo: 'al_dia' | 'vigencia_media' | 'en_riesgo';
    requiere_confirmacion?: boolean;
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
    } else if (p.requiere_confirmacion) {
      visibilidadTexto = 'Con Nota de Confirmación';
    }

    const fechaFormateada = p.updated_at
      ? new Date(p.updated_at).toLocaleDateString('es-MX', {
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
