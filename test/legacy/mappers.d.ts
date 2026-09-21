export function legacyToProduct(p: unknown): {
  id: unknown;
  nombre: unknown;
  precio: number;
  unidad: unknown;
  stock: number;
  stockMinimo: number;
  codigoBarras: unknown;
};

export function legacyToProductFromRealtime(producto: unknown): {
  id: unknown;
  nombre: unknown;
  precio: number;
  unidad: unknown;
  stock: number;
  stockMinimo: number;
  codigoBarras: unknown;
};

export function legacyToProductUpsert(producto: unknown): {
  id: unknown;
  negocio_id: 1;
  nombre: unknown;
  precio: number;
  unidad: unknown;
  stock: number;
  stock_minimo: number;
  codigo_barras: unknown;
};

export function legacyToSaleItem(it: unknown): {
  productoId: unknown;
  nombre: unknown;
  cantidad: number;
  unidad: unknown;
  precio: number;
  subtotal: number;
};

export function legacyToSale(
  v: unknown,
  items?: unknown[],
): {
  id: unknown;
  fecha: Date;
  tipo: "venta";
  total: number;
  pago: unknown;
  items: unknown[];
};

export function legacyToStockMovementFromRealtime(movimiento: unknown): {
  id: unknown;
  fecha: Date;
  tipo: unknown;
  productoId: unknown;
  cantidad: number;
  unidad: unknown;
  diferencia: number;
  motivo: unknown;
};

export function legacyToCashShift(data: unknown): {
  id: unknown;
  fecha: unknown;
  estado: unknown;
  horaApertura: unknown;
  horaCierre: unknown;
  cerradoAutomaticamente: unknown;
  total: number;
  cantidadVentas: number;
};
