import { describe, expect, it } from "vitest";
import {
  legacyAgregarProducto,
  legacyCalculateItems,
  legacyCambiarCantidad,
  legacyCantidadEnCarrito,
  legacyCartTotal,
  legacyQuitarProducto,
} from "../../test/legacy/cart.js";
import {
  addToCart,
  type CartEntry,
  calculateCartItems,
  calculateCartTotal,
  changeCartQuantity,
  getQuantityInCart,
  removeFromCart,
} from "./useSaleCart";

const mockProducts = [
  { id: 1, nombre: "Yerba 1kg", precio: 190, unidad: "unidad", stock: 10 },
  { id: 2, nombre: "Manzanas kg", precio: 80, unidad: "kg", stock: 5 },
  { id: 3, nombre: "Galletitas", precio: 65, unidad: "unidad", stock: 2 },
];

describe("useSaleCart pure cart functions parity and bug #10 pinning", () => {
  it("getQuantityInCart matches legacyCantidadEnCarrito", () => {
    const cart: CartEntry[] = [
      { id: 1, cantidad: 2 },
      { id: 2, cantidad: 1.5 },
    ];
    expect(getQuantityInCart(cart, 1)).toBe(legacyCantidadEnCarrito(cart, 1));
    expect(getQuantityInCart(cart, 2)).toBe(legacyCantidadEnCarrito(cart, 2));
    expect(getQuantityInCart(cart, 99)).toBe(legacyCantidadEnCarrito(cart, 99));
    expect(getQuantityInCart(cart, 99)).toBe(0);
  });

  it("addToCart matches legacyAgregarProducto (unidad +1, kg +0.5, stock cap)", () => {
    let cart: CartEntry[] = [];
    let legacyCart: unknown[] = [];

    // Add unit product
    cart = addToCart(cart, mockProducts[0]);
    legacyCart = legacyAgregarProducto(legacyCart, mockProducts[0]);
    expect(cart).toEqual(legacyCart);
    expect(cart).toEqual([{ id: 1, cantidad: 1 }]);

    // Add kg product (step 0.5)
    cart = addToCart(cart, mockProducts[1]);
    legacyCart = legacyAgregarProducto(legacyCart, mockProducts[1]);
    expect(cart).toEqual(legacyCart);
    expect(cart).toEqual([
      { id: 1, cantidad: 1 },
      { id: 2, cantidad: 0.5 },
    ]);

    // Add more of unit product
    cart = addToCart(cart, mockProducts[0]);
    legacyCart = legacyAgregarProducto(legacyCart, mockProducts[0]);
    expect(cart).toEqual(legacyCart);
    expect(cart[0].cantidad).toBe(2);

    // Stock cap: product 3 has stock 2
    let cart3: CartEntry[] = [];
    cart3 = addToCart(cart3, mockProducts[2]); // qty 1
    cart3 = addToCart(cart3, mockProducts[2]); // qty 2
    const cart3Before = [...cart3];
    cart3 = addToCart(cart3, mockProducts[2]); // exceeds stock 2, returns unchanged
    expect(cart3).toEqual(cart3Before);
    expect(cart3[0].cantidad).toBe(2);
  });

  it("changeCartQuantity matches legacyCambiarCantidad", () => {
    const initialCart: CartEntry[] = [
      { id: 1, cantidad: 2 },
      { id: 2, cantidad: 1.5 },
    ];

    // Increment unit product
    const step1 = changeCartQuantity(initialCart, mockProducts, 1, 1);
    const legacy1 = legacyCambiarCantidad(initialCart, mockProducts, 1, 1);
    expect(step1).toEqual(legacy1);
    expect(step1[0].cantidad).toBe(3);

    // Decrement kg product by 1 step (-0.5)
    const step2 = changeCartQuantity(initialCart, mockProducts, 2, -1);
    const legacy2 = legacyCambiarCantidad(initialCart, mockProducts, 2, -1);
    expect(step2).toEqual(legacy2);
    expect(step2[1].cantidad).toBe(1);

    // Decrement unit product to 0 (should be filtered out)
    const step3 = changeCartQuantity([{ id: 1, cantidad: 1 }], mockProducts, 1, -1);
    const legacy3 = legacyCambiarCantidad([{ id: 1, cantidad: 1 }], mockProducts, 1, -1);
    expect(step3).toEqual(legacy3);
    expect(step3).toEqual([]);
  });

  it("pins bug #10: changeCartQuantity throws TypeError when product is missing from products list", () => {
    const cart: CartEntry[] = [{ id: 999, cantidad: 1 }];
    // Product 999 is absent from mockProducts.
    // In legacy: `producto.unidad` throws TypeError: Cannot read properties of undefined
    expect(() => legacyCambiarCantidad(cart, mockProducts, 999, 1)).toThrow(TypeError);
    expect(() => changeCartQuantity(cart, mockProducts, 999, 1)).toThrow(TypeError);
  });

  it("removeFromCart matches legacyQuitarProducto", () => {
    const cart: CartEntry[] = [
      { id: 1, cantidad: 2 },
      { id: 2, cantidad: 1.5 },
    ];
    expect(removeFromCart(cart, 1)).toEqual(legacyQuitarProducto(cart, 1));
    expect(removeFromCart(cart, 1)).toEqual([{ id: 2, cantidad: 1.5 }]);
  });

  it("calculateCartItems and calculateCartTotal match legacy oracle", () => {
    const cart: CartEntry[] = [
      { id: 1, cantidad: 2 },
      { id: 2, cantidad: 1.5 },
    ];
    const items = calculateCartItems(cart, mockProducts);
    const legacyItems = legacyCalculateItems(cart, mockProducts);
    expect(items).toEqual(legacyItems);

    const total = calculateCartTotal(items);
    const legacyTotal = legacyCartTotal(legacyItems);
    expect(total).toBe(legacyTotal);
    expect(total).toBe(2 * 190 + 1.5 * 80); // 380 + 120 = 500
  });
});
