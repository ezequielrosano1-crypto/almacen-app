// Oracle: legacy cart expressions copied read-only from origin/main:src/App.jsx 851-923

export function legacyCantidadEnCarrito(carrito, id) {
  return carrito.find((c) => c.id === id)?.cantidad || 0;
}

export function legacyAgregarProducto(carrito, producto) {
  const enCarrito = legacyCantidadEnCarrito(carrito, producto.id);
  const incremento = producto.unidad === "kg" ? 0.5 : 1;
  if (enCarrito + incremento > producto.stock) return carrito;
  if (enCarrito === 0) {
    return [...carrito, { id: producto.id, cantidad: incremento }];
  }
  return carrito.map((it) =>
    it.id === producto.id ? { ...it, cantidad: it.cantidad + incremento } : it,
  );
}

export function legacyCambiarCantidad(carrito, productos, id, delta) {
  const producto = productos.find((p) => p.id === id);
  const paso = producto.unidad === "kg" ? 0.5 : 1;
  return carrito
    .map((it) => {
      if (it.id !== id) return it;
      const nueva = Math.round((it.cantidad + delta * paso) * 100) / 100;
      return { ...it, cantidad: nueva };
    })
    .filter((it) => it.cantidad > 0 && it.cantidad <= producto.stock);
}

export function legacyQuitarProducto(carrito, id) {
  return carrito.filter((it) => it.id !== id);
}

export function legacyCalculateItems(carrito, productos) {
  return carrito.map((it) => {
    const producto = productos.find((p) => p.id === it.id);
    return { ...it, producto, subtotal: producto.precio * it.cantidad };
  });
}

export function legacyCartTotal(items) {
  return items.reduce((a, it) => a + it.subtotal, 0);
}
