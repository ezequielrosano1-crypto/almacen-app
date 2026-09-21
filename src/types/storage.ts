import type { MovementId, ProductId } from "./domain";

// Estas son las claves EXACTAS que el código actual ya escribió en el
// dispositivo del usuario. No se traducen ni se versiona el formato.
export interface StoredSaleItem {
  productoId: ProductId;
  nombre: string;
  cantidad: number;
  unidad: string;
  precio: number;
  subtotal: number;
}

export interface StoredSaleMovement {
  id: MovementId;
  fecha: string;
  tipo: "venta";
  total: number;
  pago: string;
  items: StoredSaleItem[];
}

export interface StoredStockEntryMovement {
  id: MovementId;
  fecha: string;
  tipo: "entrada";
  productoId: ProductId;
  producto?: string;
  cantidad: number;
  unidad: string;
  diferencia?: number;
  motivo?: string;
}

export interface StoredStockAdjustmentMovement {
  id: MovementId;
  fecha: string;
  tipo: "ajuste";
  producto?: string;
  diferencia: number;
  motivo: string;
  productoId?: ProductId;
  cantidad?: number;
  unidad?: string;
}

export type StoredStockMovement =
  | StoredSaleMovement
  | StoredStockEntryMovement
  | StoredStockAdjustmentMovement;

export interface StoredBusinessInfo {
  nombre: string;
  contacto: string;
}

export interface StoredClosingSummary {
  fecha: string;
  hora: string;
  total: number;
  cantidadVentas: number;
  automatico?: boolean;
}

export interface StoredCashShift {
  id: string;
  fecha: string;
  estado: string;
  horaApertura: string;
  horaCierre: string | null;
  cerradoAutomaticamente: boolean;
  total?: number;
  cantidadVentas?: number;
}
