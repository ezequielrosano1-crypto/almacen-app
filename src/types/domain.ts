// Identificadores: los ids de base los genera Postgres (identity); nextId() solo
// crea ids locales efímeros. Conviven number y string (se preserva tal cual).
export type ProductId = number | string;
export type SaleId = number | string;
export type MovementId = number | string;

export type MeasurementUnit = "unidad" | "kg"; // valores persistidos
export type PaymentMethod = "Efectivo" | "Débito"; // valores persistidos y visibles
export type ProductStatus = "normal" | "low" | "outOfStock"; // valores internos, no persistidos
export type CashShiftStatus = "ABIERTA" | "CERRADA"; // valores persistidos

export interface Product {
  id: ProductId;
  name: string;
  price: number;
  unit: MeasurementUnit;
  stock: number;
  minimumStock: number;
  barcode: string | null;
}

export interface SaleItem {
  productId: ProductId;
  name: string;
  quantity: number;
  unit: MeasurementUnit;
  price: number;
  subtotal: number;
}

// Unión discriminada por `type`; los VALORES siguen siendo los persistidos.
export interface SaleMovement {
  id: MovementId;
  date: Date;
  type: "venta";
  total: number;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
}

// `productName` es opcional porque el handler de realtime (2469-2479) no lo
// completa: esa diferencia es observable y se preserva.
export interface StockEntryMovement {
  id: MovementId;
  date: Date;
  type: "entrada";
  productId: ProductId;
  productName?: string;
  quantity: number;
  unit: MeasurementUnit;
  difference?: number;
  reason?: string;
}

export interface StockAdjustmentMovement {
  id: MovementId;
  date: Date;
  type: "ajuste";
  productName?: string;
  difference: number;
  reason: string;
  productId?: ProductId;
  quantity?: number;
  unit?: MeasurementUnit;
}

export type StockMovement = SaleMovement | StockEntryMovement | StockAdjustmentMovement;
export type StockMovementType = StockMovement["type"];

// `total` y `salesCount` son opcionales: la jornada recién abierta (261-268)
// no los trae.
export interface CashShift {
  id: string;
  date: string; // "YYYY-MM-DD"
  status: CashShiftStatus;
  openingTime: string; // "HH:MM"
  closingTime: string | null;
  isAutoClosed: boolean;
  total?: number;
  salesCount?: number;
}

export interface ClosingSummary {
  date: string;
  time: string;
  total: number;
  salesCount: number;
  isAutoClosed?: boolean;
}

export interface BusinessInfo {
  name: string;
  contact: string;
}

export interface UruguayClock {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  hourNumber: number; // 8.5 === 08:30
}

export interface ClockOverride {
  date: string;
  hourNumber: number;
}

export interface WeekSalesBucket {
  date: string;
  day: string;
  total: number;
}

// Registro de movimiento tal como circula en el estado y en las vistas: mezcla
// claves en español (persistidas) e inglés (alias), por eso casi todo es opcional.
export interface MovementRecordItem {
  id: MovementId;
  tipo?: string;
  type?: string;
  fecha: Date | string;
  date?: Date | string;
  productoId?: ProductId;
  productId?: ProductId;
  total?: number;
  producto?: string;
  productName?: string;
  cantidad?: number;
  quantity?: number;
  unidad?: string;
  unit?: string;
  diferencia?: number;
  difference?: number;
  motivo?: string;
  reason?: string;
  pago?: string;
  paymentMethod?: string;
  items?: Array<{
    productId?: ProductId;
    nombre?: string;
    name?: string;
    cantidad: number;
    unidad?: string;
    unit?: string;
    precio?: number;
    price?: number;
    quantity?: number;
    subtotal?: number;
    productoId?: ProductId;
  }>;
}
