import * as XLSX from 'xlsx';

export interface ParseResult {
  productos: any[];
  errores: string[];
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
    
    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 por encabezado y base 0
      
      // Columnas fijas obligatorias
      if (!row['SKU_Interno']) {
        errores.push(`Fila ${rowNum}: Falta SKU_Interno`);
        return;
      }
      if (!row['Numero_Parte']) {
        errores.push(`Fila ${rowNum}: Falta Numero_Parte (${row['SKU_Interno']})`);
        return;
      }
      if (!row['Marca']) {
        errores.push(`Fila ${rowNum}: Falta Marca (${row['SKU_Interno']})`);
        return;
      }
      if (!row['Categoria']) {
        errores.push(`Fila ${rowNum}: Falta Categoria (${row['SKU_Interno']})`);
        return;
      }
      if (row['Costo_Base'] === undefined || row['Costo_Base'] === null) {
        errores.push(`Fila ${rowNum}: Falta Costo_Base (${row['SKU_Interno']})`);
        return;
      }

      // Separar columnas fijas y dinámicas
      const columnasFijas = ['SKU_Interno', 'Numero_Parte', 'Marca', 'Proveedor_Origen', 'Costo_Base', 'Moneda_Costo', 'Categoria', 'Imagen_URL'];
      const especificaciones_tecnicas: Record<string, any> = {};

      Object.keys(row).forEach((key) => {
        if (!columnasFijas.includes(key) && row[key] !== null && row[key] !== '') {
          especificaciones_tecnicas[key] = row[key];
        }
      });

      productos.push({
        sku_interno: String(row['SKU_Interno']).trim(),
        numero_parte: String(row['Numero_Parte']).trim(),
        marca: String(row['Marca']).trim(),
        proveedor_origen: String(row['Proveedor_Origen'] || 'No especificado').trim(),
        costo_base: parseFloat(row['Costo_Base']) || 0,
        moneda_costo: String(row['Moneda_Costo'] || 'USD').trim().toUpperCase(),
        categoria: String(row['Categoria']).trim(),
        imagen_url: row['Imagen_URL'] ? String(row['Imagen_URL']).trim() : null,
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
