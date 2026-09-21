import type {
  CashShiftRow,
  ProductRow,
  ProductUpsert,
  SaleItemRow,
  SaleRow,
  SaleWithItemsRow,
  StockMovementRow,
} from "../types/db";
import type {
  CashShift,
  CashShiftStatus,
  MeasurementUnit,
  PaymentMethod,
  Product,
  SaleItem,
  SaleMovement,
  StockMovement,
} from "../types/domain";

/**
 * Mapea una fila de producto de Supabase a la entidad de dominio Product.
 * Preserva null en barcode cuando codigo_barras es null.
 */
export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.nombre,
    price: Number(row.precio),
    unit: row.unidad as MeasurementUnit,
    stock: Number(row.stock),
    minimumStock: Number(row.stock_minimo),
    barcode: row.codigo_barras,
  };
}

/**
 * Mapea un payload de realtime de Supabase a la entidad de dominio Product.
 * Bug #6 preservado: convierte null en string vacío ("").
 */
export function toProductFromRealtime(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.nombre,
    price: Number(row.precio),
    unit: row.unidad as MeasurementUnit,
    stock: Number(row.stock),
    minimumStock: Number(row.stock_minimo),
    barcode: row.codigo_barras || "",
  };
}

/**
 * Mapea una entidad de dominio Product al payload de upsert de Supabase.
 * Inyecta negocio_id = 1 (bug #9 preservado) y convierte "" en null para codigo_barras.
 */
export function toProductUpsert(product: Product): ProductUpsert {
  return {
    id: product.id,
    negocio_id: 1,
    nombre: product.name,
    precio: Number(product.price),
    unidad: product.unit,
    stock: Number(product.stock),
    stock_minimo: Number(product.minimumStock),
    codigo_barras: product.barcode || null,
  };
}

/**
 * Mapea una fila de item de venta de Supabase a la entidad de dominio SaleItem.
 */
export function toSaleItem(row: SaleItemRow): SaleItem {
  return {
    productId: row.producto_id,
    name: row.nombre,
    quantity: Number(row.cantidad),
    unit: row.unidad as MeasurementUnit,
    price: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

/**
 * Mapea una fila de venta con items anidados a la entidad de dominio SaleMovement.
 */
export function toSaleMovement(row: SaleWithItemsRow): SaleMovement {
  return {
    id: row.id,
    date: new Date(row.fecha),
    type: "venta",
    total: Number(row.total),
    paymentMethod: row.pago as PaymentMethod,
    items: (row.venta_items || []).map(toSaleItem),
  };
}

/**
 * Mapea una fila de venta y sus items de realtime a SaleMovement.
 */
export function toSaleMovementFromRealtime(row: SaleRow, items: SaleItemRow[]): SaleMovement {
  return {
    id: row.id,
    date: new Date(row.fecha),
    type: "venta",
    total: Number(row.total),
    paymentMethod: row.pago as PaymentMethod,
    items: (items || []).map(toSaleItem),
  };
}

/**
 * Mapea una fila de movimiento de stock de realtime a StockMovement.
 * Preserva: sin productName, Number(null) === 0 para diferencia.
 */
export function toStockMovementFromRealtime(row: StockMovementRow): StockMovement {
  if (row.tipo === "entrada") {
    return {
      id: row.id,
      date: new Date(row.fecha),
      type: "entrada",
      productId: row.producto_id ?? "",
      quantity: Number(row.cantidad),
      unit: (row.unidad || "unidad") as MeasurementUnit,
      difference: Number(row.diferencia),
      reason: row.motivo || undefined,
    };
  }

  return {
    id: row.id,
    date: new Date(row.fecha),
    type: "ajuste",
    difference: Number(row.diferencia),
    reason: row.motivo || "",
    productId: row.producto_id !== null ? row.producto_id : undefined,
    quantity: Number(row.cantidad),
    unit: (row.unidad || "unidad") as MeasurementUnit,
  };
}

/**
 * Mapea una fila de jornada de Supabase a CashShift.
 * Lee columna cerrado_automatico a isAutoClosed.
 */
export function toCashShift(row: CashShiftRow): CashShift {
  return {
    id: row.id,
    date: row.fecha,
    status: row.estado as CashShiftStatus,
    openingTime: row.hora_apertura,
    closingTime: row.hora_cierre,
    isAutoClosed: row.cerrado_automatico,
    total: Number(row.total || 0),
    salesCount: Number(row.cantidad_ventas || 0),
  };
}
