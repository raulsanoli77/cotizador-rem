/**
 * Motor de Precios - REM Industrial
 * Implementa las 4 fórmulas de cálculo de precio de venta
 * según la combinación de moneda de costo y moneda de venta.
 */

export type MonedaCosto = 'USD' | 'MXN';
export type MonedaVenta = 'USD' | 'MXN';
export type FormulaAplicada = 'F1_MX_USA' | 'F2_MX_MX' | 'F3_USA_USA' | 'F4_USA_MX';

export interface ResultadoPrecio {
  precioVenta: number;
  monedaVenta: MonedaVenta;
  formulaAplicada: FormulaAplicada;
  desglose: Record<string, number>;
}

// Factores de margen (parametrizados para fácil ajuste)
const FACTORES = {
  RECARGO_IMPORTACION: 1.15, // 15% recargo importación
  MARGEN_USA: 1.4,           // Factor de utilidad proveedor USA (antes 1.5)
  MARGEN_BASE: 0.7,          // 30% margen (costo / 0.7)
  IVA: 0.16,                 // 16% IVA México
};

/**
 * Redondea el tipo de cambio hacia arriba al entero más cercano.
 * Ej: 17.34 → 18, 20.0 → 20
 */
export function redondearTCArribaEntero(tc: number): number {
  if (tc <= 0) throw new Error('El tipo de cambio debe ser mayor a 0');
  return Math.ceil(tc);
}

/**
 * Redondea el tipo de cambio hacia abajo al entero más cercano.
 * Ej: 17.34 → 17, 20.0 → 20
 */
export function redondearTCAbajoEntero(tc: number): number {
  if (tc <= 0) throw new Error('El tipo de cambio debe ser mayor a 0');
  return Math.floor(tc);
}

/**
 * Determina qué fórmula de precio aplicar según la combinación
 * de moneda de costo del proveedor y moneda de venta al cliente.
 * RESTRICCIÓN ACTUAL: El sistema fuerza las ventas a MXN (Reglas 1 y 2).
 */
export function determinarFormula(
  monedaCosto: MonedaCosto,
  monedaVenta: MonedaVenta
): FormulaAplicada {
  // Ignoramos monedaVenta para forzar precios en MXN
  if (monedaCosto === 'USD') return 'F1_MX_USA';
  if (monedaCosto === 'MXN') return 'F2_MX_MX';
  
  throw new Error(`Combinación de monedas no válida: costo=${monedaCosto}`);
}

/**
 * Calcula el precio de venta aplicando la fórmula correspondiente.
 *
 * Fórmula 1 (Venta MXN / Proveedor USD):
 *   Precio = Costo_USD × 1.15 × 1.5 × TC_Redondeado_Arriba
 *
 * Fórmula 2 (Venta MXN / Proveedor MXN):
 *   Precio = Costo_MXN / 0.7
 *
 * Fórmula 3 (Venta USD / Proveedor USD):
 *   Precio = Costo_USD / 0.7
 *
 * Fórmula 4 (Venta USD / Proveedor MXN):
 *   Precio = ((Costo_MXN + IVA) / 0.7) / TC_Redondeado_Abajo
 */
export function calcularPrecioVenta(
  costoBase: number,
  monedaCosto: MonedaCosto,
  monedaVenta: MonedaVenta,
  tipoCambio: number
): ResultadoPrecio {
  // Validaciones
  if (costoBase < 0) throw new Error('El costo base no puede ser negativo');
  if (costoBase === 0) {
    return {
      precioVenta: 0,
      monedaVenta,
      formulaAplicada: determinarFormula(monedaCosto, monedaVenta),
      desglose: { costoBase: 0 },
    };
  }
  if (tipoCambio <= 0) throw new Error('El tipo de cambio debe ser mayor a 0');

  const formula = determinarFormula(monedaCosto, monedaVenta);

  switch (formula) {
    case 'F1_MX_USA': {
      const tcArriba = redondearTCArribaEntero(tipoCambio);
      const conRecargo = costoBase * FACTORES.RECARGO_IMPORTACION;
      const conMargen = conRecargo * FACTORES.MARGEN_USA;
      const precioVenta = conMargen * tcArriba;
      return {
        precioVenta: Math.round(precioVenta * 100) / 100,
        monedaVenta: 'MXN',
        formulaAplicada: 'F1_MX_USA',
        desglose: {
          costoBase,
          recargoImportacion: FACTORES.RECARGO_IMPORTACION,
          margenUSA: FACTORES.MARGEN_USA,
          tipoCambioUsado: tcArriba,
          tipoCambioOriginal: tipoCambio,
        },
      };
    }

    case 'F2_MX_MX': {
      const precioVenta = costoBase / FACTORES.MARGEN_BASE;
      return {
        precioVenta: Math.round(precioVenta * 100) / 100,
        monedaVenta: 'MXN',
        formulaAplicada: 'F2_MX_MX',
        desglose: {
          costoBase,
          margen: FACTORES.MARGEN_BASE,
        },
      };
    }

    case 'F3_USA_USA': {
      const precioVenta = costoBase / FACTORES.MARGEN_BASE;
      return {
        precioVenta: Math.round(precioVenta * 100) / 100,
        monedaVenta: 'USD',
        formulaAplicada: 'F3_USA_USA',
        desglose: {
          costoBase,
          margen: FACTORES.MARGEN_BASE,
        },
      };
    }

    case 'F4_USA_MX': {
      const tcAbajo = redondearTCAbajoEntero(tipoCambio);
      const costoConIVA = costoBase * (1 + FACTORES.IVA);
      const conMargen = costoConIVA / FACTORES.MARGEN_BASE;
      const precioVenta = conMargen / tcAbajo;
      return {
        precioVenta: Math.round(precioVenta * 100) / 100,
        monedaVenta: 'USD',
        formulaAplicada: 'F4_USA_MX',
        desglose: {
          costoBase,
          iva: FACTORES.IVA,
          costoConIVA,
          margen: FACTORES.MARGEN_BASE,
          tipoCambioUsado: tcAbajo,
          tipoCambioOriginal: tipoCambio,
        },
      };
    }

    default:
      throw new Error(`Fórmula desconocida: ${formula}`);
  }
}

/**
 * Formatea un precio con símbolo de moneda y 2 decimales.
 */
export function formatearPrecio(precio: number, moneda: MonedaVenta): string {
  if (moneda === 'MXN') {
    return `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  }
  return `$${precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}
