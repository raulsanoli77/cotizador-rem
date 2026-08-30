/**
 * Gestión del Tipo de Cambio USD/MXN
 * Obtiene y cachea el tipo de cambio diario.
 */

export interface TipoCambioCache {
  valor: number;
  fecha: string;
  fuente: string;
}

export const TIPO_CAMBIO_DEFAULT = 20.0;

// Cache en memoria
let cache: TipoCambioCache | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Obtiene el tipo de cambio USD → MXN.
 * Cachea el resultado por 24 horas.
 * Si la API falla, retorna el valor por defecto.
 */
export async function obtenerTipoCambio(): Promise<TipoCambioCache> {
  const ahora = Date.now();

  // Retornar cache si es válido
  if (cache && (ahora - cacheTimestamp) < CACHE_TTL_MS) {
    return cache;
  }

  try {
    const apiUrl = process.env.EXCHANGE_RATE_API_URL
      || 'https://api.exchangerate-api.com/v4/latest/USD';

    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 }, // Cache Next.js 24h
    });

    if (!response.ok) {
      throw new Error(`API respondió con status ${response.status}`);
    }

    const data = await response.json();
    const mxnRate = data.rates?.MXN;

    if (!mxnRate || typeof mxnRate !== 'number') {
      throw new Error('Respuesta de API no contiene rate MXN válido');
    }

    cache = {
      valor: mxnRate,
      fecha: new Date().toISOString(),
      fuente: 'exchangerate-api.com',
    };
    cacheTimestamp = ahora;

    return cache;
  } catch (error) {
    console.warn(
      '[ExchangeRate] Error al obtener tipo de cambio, usando valor por defecto:',
      error instanceof Error ? error.message : error
    );

    // Retornar cache expirado si existe, sino default
    if (cache) {
      console.warn('[ExchangeRate] Usando cache expirado:', cache);
      return cache;
    }

    return {
      valor: TIPO_CAMBIO_DEFAULT,
      fecha: new Date().toISOString(),
      fuente: 'valor_por_defecto',
    };
  }
}

/**
 * Invalida el cache del tipo de cambio.
 * Útil cuando el admin actualiza el TC manualmente.
 */
export function invalidarCacheTipoCambio(): void {
  cache = null;
  cacheTimestamp = 0;
}
