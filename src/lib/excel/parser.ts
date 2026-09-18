import * as XLSX from 'xlsx';

export interface ParseResult {
  productos: any[];
  errores: string[];
}

// Mapa de aliases: permite que el Excel use nombres diferentes a los del sistema
// La clave es el nombre NORMALIZADO (lowercase, sin espacios extra)
// El valor es el campo del sistema al que corresponde
const COLUMN_ALIASES: Record<string, string> = {
  // Formato del Excel del usuario → campo del sistema
  'sku_interno': 'sku_interno',
  'numero de parte': 'numero_parte',
  'numero_parte': 'numero_parte',
  'marca': 'marca',
  'categoria': 'categoria',
  'costo': 'costo_base',
  'costo_base': 'costo_base',
  'moneda': 'moneda_costo',
  'moneda_costo': 'moneda_costo',
  'pais de origen': 'proveedor_origen',
  'proveedor_origen': 'proveedor_origen',
  'imagen_url': 'imagen_url',
};

// Columnas que son campos fijos del producto (no van a especificaciones_tecnicas)
const CAMPOS_FIJOS = new Set([
  'sku_interno', 'numero_parte', 'marca', 'categoria',
  'costo_base', 'moneda_costo', 'proveedor_origen', 'imagen_url'
]);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

export function parsearExcelProductos(fileBuffer: ArrayBuffer): ParseResult {
  const errores: string[] = [];
  const productos: any[] = [];
  
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convertir a JSON, asumiendo la fila 1 como encabezados
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as any[];
    
    if (rows.length === 0) {
      errores.push('El archivo está vacío o no tiene datos.');
      return { productos, errores };
    }

    // Construir el mapeo de columnas del Excel actual
    const excelColumns = Object.keys(rows[0]);
    const columnMapping: Record<string, { systemField: string | null; originalName: string }> = {};
    
    excelColumns.forEach(col => {
      const normalized = normalizeKey(col);
      const systemField = COLUMN_ALIASES[normalized] || null;
      columnMapping[col] = { systemField, originalName: col };
    });

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 por encabezado y base 0
      
      // Construir objeto con campos mapeados
      const mapped: Record<string, any> = {};
      const especificaciones_tecnicas: Record<string, any> = {};

      // Determinar la unidad base del producto para auto-formato
      let sufijoMedida = '';
      const unidadMedidaVal = String(row['UNIDAD DE MEDIDA'] || row['unidad de medida'] || '').trim().toUpperCase();
      if (unidadMedidaVal === 'IN' || unidadMedidaVal === 'PULGADAS') {
        sufijoMedida = '"';
      } else if (unidadMedidaVal === 'MM' || unidadMedidaVal === 'MILIMETROS') {
        sufijoMedida = ' mm';
      }

      // Palabras clave para saber si un campo es una medida física que lleva " o mm
      const palabrasMedida = ['DIAMETRO', 'CORTE', 'LARGO', 'ZANCO'];

      excelColumns.forEach(col => {
        const value = row[col];
        const { systemField, originalName } = columnMapping[col];
        
        if (systemField && CAMPOS_FIJOS.has(systemField)) {
          // Es un campo fijo del sistema
          mapped[systemField] = value;
        } else if (value !== null && value !== '' && value !== undefined) {
          // Es una especificación técnica
          let finalValue = String(value).trim();
          const upperName = originalName.toUpperCase();
          const isNA = finalValue.toUpperCase() === 'N/A' || finalValue === '-';
          
          if (!isNA) {
            // Auto-agregar sufijo de medida (solo a Diametro, Corte (L1), Largo, Zanco)
            if (sufijoMedida) {
              const upperNameClean = upperName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const isMedida = ['DIAMETRO', 'LARGO', 'ZANCO'].some(p => upperNameClean.includes(p)) || 
                               (upperNameClean.includes('CORTE') && !upperNameClean.includes('CENTRAL') && !upperNameClean.includes('DIRECCION') && !upperNameClean.includes('CORTADOR'));
              
              if (isMedida && !finalValue.endsWith('"') && !finalValue.toLowerCase().endsWith('mm')) {
                finalValue += sufijoMedida;
              }
            }
            
            // Auto-agregar prefijos a Radio y Chaflan
            if (upperName.includes('RADIO') && !finalValue.toUpperCase().startsWith('R')) {
              finalValue = `R ${finalValue}`;
            }
            if (upperName.includes('CHAFLAN') && !finalValue.toUpperCase().startsWith('CH')) {
              finalValue = `CH ${finalValue}`;
            }
            // Auto-agregar grados a Ángulo
            if (upperName.includes('ANGULO') || upperName.includes('ÁNGULO')) {
              if (!finalValue.includes('°')) {
                finalValue = `${finalValue}°`;
              }
            }
          }
          
          especificaciones_tecnicas[originalName] = finalValue;
        }
      });

      // Validaciones obligatorias
      if (!mapped.sku_interno || mapped.sku_interno.includes('CO--') || mapped.sku_interno.includes('CO––')) {
        errores.push(`Fila ${rowNum}: SKU_Interno vacío o inválido (se requiere para actualizar)`);
        return; 
      }
      
      if (mapped.costo_base === undefined || mapped.costo_base === null || mapped.costo_base === '') {
        errores.push(`Fila ${rowNum}: Falta COSTO para el SKU ${mapped.sku_interno}`);
        return; 
      }

      if (!mapped.numero_parte) {
        errores.push(`Fila ${rowNum}: Falta Numero_Parte / NUMERO DE PARTE (${mapped.sku_interno})`);
        return;
      }
      if (!mapped.marca) {
        errores.push(`Fila ${rowNum}: Falta Marca (${mapped.sku_interno})`);
        return;
      }
      if (!mapped.categoria) {
        errores.push(`Fila ${rowNum}: Falta Categoria (${mapped.sku_interno})`);
        return;
      }

      productos.push({
        sku_interno: String(mapped.sku_interno).trim(),
        numero_parte: String(mapped.numero_parte).trim(),
        marca: String(mapped.marca).trim(),
        proveedor_origen: String(mapped.proveedor_origen || 'No especificado').trim(),
        costo_base: parseFloat(mapped.costo_base) || 0,
        moneda_costo: String(mapped.moneda_costo || 'USD').trim().toUpperCase(),
        categoria: String(mapped.categoria).trim(),
        imagen_url: mapped.imagen_url ? String(mapped.imagen_url).trim() : null,
        especificaciones_tecnicas,
        activo: true
      });
    });

  } catch (error) {
    errores.push('Error al procesar el archivo Excel. Verifica el formato.');
    console.error(error);
  }

  return { productos, errores };
}
