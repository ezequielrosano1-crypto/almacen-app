import { useMemo, useState } from "react";

export interface CartEntry {
  id: number | string;
  cantidad: number;
}

export interface CartItem extends CartEntry {
  producto: unknown;
  subtotal: number;
}

export function getQuantityInCart(cart: CartEntry[], id: number | string): number {
  return cart.find((c) => c.id === id)?.cantidad || 0;
}

export function addToCart<
  P extends { id: number | string; unidad?: string; unit?: string; stock: number },
>(cart: CartEntry[], product: P): CartEntry[] {
  const enCarrito = getQuantityInCart(cart, product.id);
  const incremento = product.unidad === "kg" || product.unit === "kg" ? 0.5 : 1;
  if (enCarrito + incremento > product.stock) {
    return cart;
  }
  if (enCarrito === 0) {
    return [...cart, { id: product.id, cantidad: incremento }];
  }
  return cart.map((it) =>
    it.id === product.id ? { ...it, cantidad: it.cantidad + incremento } : it,
  );
}

export function changeCartQuantity<
  P extends { id: number | string; unidad?: string; unit?: string; stock: number },
>(cart: CartEntry[], products: P[], id: number | string, delta: number): CartEntry[] {
  // BUG #10: En la implementación original (líneas 904-905 y 919-922 de origin/main:src/App.jsx),
  // si el producto no se encuentra en el listado, se accede directamente a sus propiedades
  // sin validar nulidad (non-null assertion), lanzando TypeError en tiempo de ejecución.
  // Preservamos este comportamiento verbatim por contrato de caracterización (Decision D7).
  const producto = products.find((p) => p.id === id);
  const unidad = (producto as NonNullable<P>).unidad ?? (producto as NonNullable<P>).unit;
  const paso = unidad === "kg" ? 0.5 : 1;

  return cart
    .map((it) => {
      if (it.id !== id) {
        return it;
      }
      const nueva = Math.round((it.cantidad + delta * paso) * 100) / 100;
      return { ...it, cantidad: nueva };
    })
    .filter((it) => it.cantidad > 0 && it.cantidad <= (producto as NonNullable<P>).stock);
}

export function removeFromCart(cart: CartEntry[], id: number | string): CartEntry[] {
  return cart.filter((it) => it.id !== id);
}

export function calculateCartItems<
  P extends { id: number | string; precio?: number; price?: number },
>(cart: CartEntry[], products: P[]): CartItem[] {
  return cart.map((it) => {
    const producto = products.find((p) => p.id === it.id);
    const precio = producto ? (producto.precio ?? producto.price) || 0 : 0;
    return {
      ...it,
      producto,
      subtotal: precio * it.cantidad,
    };
  });
}

export function calculateCartTotal(items: { subtotal: number }[]): number {
  return items.reduce((a, it) => a + it.subtotal, 0);
}

export function useSaleCart<
  P extends {
    id: number | string;
    unidad?: string;
    unit?: string;
    stock: number;
    precio?: number;
    price?: number;
  },
>(products: P[]) {
  const [carrito, setCarrito] = useState<CartEntry[]>([]);

  const items = useMemo(() => calculateCartItems(carrito, products), [carrito, products]);
  const total = useMemo(() => calculateCartTotal(items), [items]);

  const agregarProducto = (producto: P) => {
    setCarrito((c) => addToCart(c, producto));
  };

  const cambiarCantidad = (id: number | string, delta: number) => {
    setCarrito((c) => changeCartQuantity(c, products, id, delta));
  };

  const quitarProducto = (id: number | string) => {
    setCarrito((c) => removeFromCart(c, id));
  };

  const cantidadEnCarrito = (id: number | string) => {
    return getQuantityInCart(carrito, id);
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  return {
    cart: carrito,
    carrito,
    setCart: setCarrito,
    setCarrito,
    items,
    total,
    addToCart: agregarProducto,
    agregarProducto,
    changeQuantity: cambiarCantidad,
    cambiarCantidad,
    removeFromCart: quitarProducto,
    quitarProducto,
    getQuantityInCart: cantidadEnCarrito,
    cantidadEnCarrito,
    clearCart: limpiarCarrito,
    limpiarCarrito,
  };
}
