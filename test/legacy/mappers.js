// Snapshot verbatim de las funciones de mapeo de Supabase en src/App.jsx.
// Utilizado como oráculo inmutable para pruebas de caracterización (D8).
// NO EDITAR este archivo.

export function legacyToProduct(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    precio: Number(p.precio),
    unidad: p.unidad,
    stock: Number(p.stock),
    stockMinimo: Number(p.stock_minimo),
    codigoBarras: p.codigo_barras,
  };
}

export function legacyToProductFromRealtime(producto) {
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    unidad: producto.unidad,
    stock: Number(producto.stock),
    stockMinimo: Number(producto.stock_minimo),
    codigoBarras: producto.codigo_barras || "",
  };
}

export function legacyToProductUpsert(producto) {
  return {
    id: producto.id,
    negocio_id: 1,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    unidad: producto.unidad,
    stock: Number(producto.stock),
    stock_minimo: Number(producto.stockMinimo),
    codigo_barras: producto.codigoBarras || null,
  };
}

export function legacyToSaleItem(it) {
  return {
    productoId: it.producto_id,
    nombre: it.nombre,
    cantidad: Number(it.cantidad),
    unidad: it.unidad,
    precio: Number(it.precio_unitario),
    subtotal: Number(it.subtotal),
  };
}

export function legacyToSale(v, items = v.venta_items || []) {
  return {
    id: v.id,
    fecha: new Date(v.fecha),
    tipo: "venta",
    total: Number(v.total),
    pago: v.pago,
    items: (items || []).map(legacyToSaleItem),
  };
}

export function legacyToStockMovementFromRealtime(movimiento) {
  return {
    id: movimiento.id,
    fecha: new Date(movimiento.fecha),
    tipo: movimiento.tipo,
    productoId: movimiento.producto_id,
    cantidad: Number(movimiento.cantidad),
    unidad: movimiento.unidad,
    diferencia: Number(movimiento.diferencia),
    motivo: movimiento.motivo,
  };
}

export function legacyToCashShift(data) {
  return {
    id: data.id,
    fecha: data.fecha,
    estado: data.estado,
    horaApertura: data.hora_apertura,
    horaCierre: data.hora_cierre,
    cerradoAutomaticamente: data.cerrado_automatico,
    total: Number(data.total || 0),
    cantidadVentas: Number(data.cantidad_ventas || 0),
  };
}
