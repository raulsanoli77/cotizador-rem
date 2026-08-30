export interface Cotizacion {
  id: string;
  lead_id: string;
  partidas: PartidaCotizacion[];
  subtotal: number;
  moneda_venta: 'USD' | 'MXN';
  tipo_cambio_usado: number;
  formula_aplicada: string;
  created_at: string;
  estatus: 'borrador' | 'solicitada' | 'en_proceso' | 'completada';
  folio: string;
}

export interface PartidaCotizacion {
  producto_id: string;
  sku_interno: string;
  numero_parte: string;
  marca: string;
  descripcion_tecnica: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  moneda: 'USD' | 'MXN';
}

export interface ItemCarrito {
  producto: import('./product').ProductoConPrecio;
  cantidad: number;
}
