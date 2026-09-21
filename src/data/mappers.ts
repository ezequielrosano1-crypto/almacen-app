import type {
  CashShiftRow,
  ProductInsert,
  ProductRow,
  ProductUpsert,
  SaleItemRow,
  SaleRow,
  SaleWithItemsRow,
  StockMovementRow,
} from "../types/db";
import type {
  BusinessInfo,
  CashShift,
  CashShiftStatus,
  ClosingSummary,
  MeasurementUnit,
  PaymentMethod,
  Product,
  SaleItem,
  SaleMovement,
  StockAdjustmentMovement,
  StockEntryMovement,
  StockMovement,
} from "../types/domain";
import type {
  StoredBusinessInfo,
  StoredCashShift,
  StoredClosingSummary,
  StoredSaleMovement,
  StoredStockAdjustmentMovement,
  StoredStockEntryMovement,
  StoredStockMovement,
} from "../types/storage";

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

/** Same as toProductUpsert but without id: the database assigns it on insert. */
export function toProductInsert(product: Omit<Product, "id">): ProductInsert {
  const { id: _omit, ...row } = toProductUpsert({ ...product, id: 0 });
  return row;
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

/**
 * Mapea una entidad de dominio StockMovement a la representación serializada en storage.
 * Mantiene orden de claves original del fixture y formato ISO string para fechas.
 */
export function toStoredStockMovement(movement: StockMovement): StoredStockMovement {
  if (movement.type === "venta") {
    const res: StoredSaleMovement = {
      id: movement.id,
      fecha: movement.date.toISOString(),
      tipo: "venta",
      total: movement.total,
      pago: movement.paymentMethod,
      items: movement.items.map((it) => ({
        productoId: it.productId,
        nombre: it.name,
        cantidad: it.quantity,
        unidad: it.unit,
        precio: it.price,
        subtotal: it.subtotal,
      })),
    };
    return res;
  }

  if (movement.type === "entrada") {
    const res: StoredStockEntryMovement = {
      id: movement.id,
      fecha: movement.date.toISOString(),
      tipo: "entrada",
      productoId: movement.productId,
      ...(movement.productName ? { producto: movement.productName } : {}),
      cantidad: movement.quantity,
      unidad: movement.unit,
      ...(movement.difference !== undefined ? { diferencia: movement.difference } : {}),
      ...(movement.reason ? { motivo: movement.reason } : {}),
    };
    return res;
  }

  const res: StoredStockAdjustmentMovement = {
    id: movement.id,
    fecha: movement.date.toISOString(),
    tipo: "ajuste",
    ...(movement.productName ? { producto: movement.productName } : {}),
    diferencia: movement.difference,
    motivo: movement.reason,
    ...(movement.productId !== undefined ? { productoId: movement.productId } : {}),
    ...(movement.quantity !== undefined ? { cantidad: movement.quantity } : {}),
    ...(movement.unit !== undefined ? { unidad: movement.unit } : {}),
  };
  return res;
}

/**
 * Mapea un movimiento serializado de storage a la entidad de dominio StockMovement.
 * Descarta claves desconocidas (desviación aceptada D-02).
 */
export function fromStoredStockMovement(stored: StoredStockMovement): StockMovement {
  if (stored.tipo === "venta") {
    const res: SaleMovement = {
      id: stored.id,
      date: new Date(stored.fecha),
      type: "venta",
      total: stored.total,
      paymentMethod: stored.pago as PaymentMethod,
      items: (stored.items || []).map((it) => ({
        productId: it.productoId,
        name: it.nombre,
        quantity: it.cantidad,
        unit: it.unidad as MeasurementUnit,
        price: it.precio,
        subtotal: it.subtotal,
      })),
    };
    return res;
  }

  if (stored.tipo === "entrada") {
    const res: StockEntryMovement = {
      id: stored.id,
      date: new Date(stored.fecha),
      type: "entrada",
      productId: stored.productoId,
      ...(stored.producto ? { productName: stored.producto } : {}),
      quantity: stored.cantidad,
      unit: stored.unidad as MeasurementUnit,
      ...(stored.diferencia !== undefined ? { difference: stored.diferencia } : {}),
      ...(stored.motivo ? { reason: stored.motivo } : {}),
    };
    return res;
  }

  const res: StockAdjustmentMovement = {
    id: stored.id,
    date: new Date(stored.fecha),
    type: "ajuste",
    ...(stored.producto ? { productName: stored.producto } : {}),
    difference: stored.diferencia,
    reason: stored.motivo,
    ...(stored.productoId !== undefined ? { productId: stored.productoId } : {}),
    ...(stored.cantidad !== undefined ? { quantity: stored.cantidad } : {}),
    ...(stored.unidad !== undefined ? { unit: stored.unidad as MeasurementUnit } : {}),
  };
  return res;
}

/**
 * Mapea BusinessInfo a formato StoredBusinessInfo.
 */
export function toStoredBusinessInfo(info: BusinessInfo): StoredBusinessInfo {
  return {
    nombre: info.name,
    contacto: info.contact,
  };
}

/**
 * Mapea StoredBusinessInfo a la entidad de dominio BusinessInfo.
 */
export function fromStoredBusinessInfo(stored: StoredBusinessInfo): BusinessInfo {
  return {
    name: stored.nombre,
    contact: stored.contacto,
  };
}

/**
 * Mapea ClosingSummary a StoredClosingSummary.
 */
export function toStoredClosingSummary(closing: ClosingSummary): StoredClosingSummary {
  return {
    fecha: closing.date,
    hora: closing.time,
    total: closing.total,
    cantidadVentas: closing.salesCount,
    ...(closing.isAutoClosed !== undefined ? { automatico: closing.isAutoClosed } : {}),
  };
}

/**
 * Mapea StoredClosingSummary a ClosingSummary.
 */
export function fromStoredClosingSummary(stored: StoredClosingSummary): ClosingSummary {
  return {
    date: stored.fecha,
    time: stored.hora,
    total: stored.total,
    salesCount: stored.cantidadVentas,
    ...(stored.automatico !== undefined ? { isAutoClosed: stored.automatico } : {}),
  };
}

/**
 * Mapea CashShift a StoredCashShift.
 */
export function toStoredCashShift(shift: CashShift): StoredCashShift {
  return {
    id: shift.id,
    fecha: shift.date,
    estado: shift.status,
    horaApertura: shift.openingTime,
    horaCierre: shift.closingTime,
    cerradoAutomaticamente: shift.isAutoClosed,
    ...(shift.total !== undefined ? { total: shift.total } : {}),
    ...(shift.salesCount !== undefined ? { cantidadVentas: shift.salesCount } : {}),
  };
}

/**
 * Mapea StoredCashShift a CashShift.
 */
export function fromStoredCashShift(stored: StoredCashShift): CashShift {
  return {
    id: stored.id,
    date: stored.fecha,
    status: stored.estado as CashShiftStatus,
    openingTime: stored.horaApertura,
    closingTime: stored.horaCierre,
    isAutoClosed: stored.cerradoAutomaticamente,
    ...(stored.total !== undefined ? { total: stored.total } : {}),
    ...(stored.cantidadVentas !== undefined ? { salesCount: stored.cantidadVentas } : {}),
  };
}
