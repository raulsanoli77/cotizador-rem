export interface Producto {
  id: string;
  sku_interno: string;
  numero_parte: string;
  marca: string;
  proveedor_origen: string;
  costo_base: number;
  moneda_costo: 'USD' | 'MXN';
  categoria: string;
  categoria_id: string;
  especificaciones_tecnicas: Record<string, string | number | boolean>;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  campos_filtro: CampoFiltro[];
  descripcion: string | null;
  icono_url: string | null;
}

export interface CampoFiltro {
  nombre: string;
  tipo: 'texto' | 'numero' | 'rango' | 'seleccion';
  opciones?: string[];
  unidad?: string;
}

export interface ProductoConPrecio extends Producto {
  precio_venta: number;
  moneda_venta: 'USD' | 'MXN';
  formula_aplicada: string;
}
