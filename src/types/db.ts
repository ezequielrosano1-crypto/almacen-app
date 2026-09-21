import type { ProductId } from "./domain";

// Los nombres de campo son EXACTAMENTE las columnas de Supabase y no se
// traducen nunca. Biome desactiva useNamingConvention solo en este archivo.
export interface ProductRow {
  id: number | string;
  negocio_id: number;
  nombre: string;
  precio: number;
  unidad: string;
  stock: number;
  stock_minimo: number;
  codigo_barras: string | null;
}

export interface SaleRow {
  id: number;
  negocio_id: number;
  jornada_id: string | null;
  fecha: string;
  total: number;
  pago: string;
}

export interface SaleItemRow {
  id: number;
  venta_id: number;
  producto_id: number | string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
}

// Proyección exacta del select anidado de 2345-2360.
export interface SaleWithItemsRow {
  id: number;
  negocio_id: number;
  fecha: string;
  total: number;
  pago: string;
  venta_items: SaleItemRow[] | null;
}

export interface StockMovementRow {
  id: number | string;
  negocio_id: number;
  producto_id: number | string | null;
  jornada_id: string | null;
  fecha: string;
  tipo: string;
  cantidad: number | null;
  unidad: string | null;
  diferencia: number | null;
  motivo: string | null;
}

// OJO: la columna real es `cerrado_automatico` (NO `cerrado_automaticamente`,
// como decía el glosario de la propuesta). Verificado en 194, 231, 280, 1170,
// 2569, 2646 y 2662.
export interface CashShiftRow {
  id: string;
  negocio_id: number;
  fecha: string;
  estado: string;
  hora_apertura: string;
  hora_cierre: string | null;
  cerrado_automatico: boolean;
  total: number | null;
  cantidad_ventas: number | null;
  updated_at?: string;
}

export interface CashShiftInsert {
  id: string;
  negocio_id: number;
  fecha: string;
  estado: string;
  hora_apertura: string;
  hora_cierre: string | null;
  cerrado_automatico: boolean;
  total: number;
  cantidad_ventas: number;
}

export interface CashShiftCloseUpdate {
  estado: string;
  hora_cierre: string;
  cerrado_automatico: boolean;
  total: number;
  cantidad_ventas: number;
  updated_at: string;
}

export interface CashShiftReopenUpdate {
  estado: string;
  hora_apertura: string;
  hora_cierre: null;
  cerrado_automatico: boolean;
  updated_at: string;
}

// Payload of the registrar_venta RPC: the whole sale is written in one transaction.
export interface RegisterSaleItem {
  producto_id: number | string;
  nombre: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
}

export interface RegisterSaleInput {
  negocio_id: number;
  jornada_id: string | null;
  pago: string;
  total: number;
  items: RegisterSaleItem[];
}

export interface StockMovementInsert {
  negocio_id: number;
  producto_id: number | string;
  jornada_id: string | null;
  fecha: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  diferencia: number;
  motivo: string;
}

export interface ProductUpsert {
  id: ProductId;
  negocio_id: number;
  nombre: string;
  precio: number;
  unidad: string;
  stock: number;
  stock_minimo: number;
  codigo_barras: string | null;
}

// New products carry no id: Postgres generates it (productos.id is an identity column).
export type ProductInsert = Omit<ProductUpsert, "id">;
