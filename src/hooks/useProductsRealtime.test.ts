import { describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { handleProductRealtimeEvent } from "./useProductsRealtime";

describe("useProductsRealtime / handleProductRealtimeEvent", () => {
  it("removes product on DELETE event", () => {
    let state = [
      { id: 1, nombre: "Yerba" },
      { id: 2, nombre: "Arroz" },
    ];
    const setProducts = (updater: any) => {
      state = updater(state);
    };

    handleProductRealtimeEvent(
      {
        eventType: "DELETE",
        old: { id: 1 },
      },
      setProducts,
    );

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe(2);
  });

  it("inserts new product and pins bug #6: barcode is '' when null", () => {
    let state: any[] = [];
    const setProducts = (updater: any) => {
      state = updater(state);
    };

    handleProductRealtimeEvent(
      {
        eventType: "INSERT",
        new: {
          id: 5,
          nombre: "Fideos",
          precio: 45,
          unidad: "unidad",
          stock: 10,
          stock_minimo: 2,
          codigo_barras: null,
        },
      },
      setProducts,
    );

    expect(state).toHaveLength(1);
    expect(state[0].id).toBe(5);
    expect(state[0].nombre).toBe("Fideos");
    // BUG #6 pinned: null barcode becomes empty string ""
    expect(state[0].codigoBarras).toBe("");
    expect(state[0].barcode).toBe("");
  });

  it("updates existing product when matching id", () => {
    let state: any[] = [{ id: 5, nombre: "Fideos", precio: 45, stock: 10 }];
    const setProducts = (updater: any) => {
      state = updater(state);
    };

    handleProductRealtimeEvent(
      {
        eventType: "UPDATE",
        new: {
          id: 5,
          nombre: "Fideos Moñita",
          precio: 52,
          unidad: "unidad",
          stock: 15,
          stock_minimo: 3,
          codigo_barras: "12345",
        },
      },
      setProducts,
    );

    expect(state).toHaveLength(1);
    expect(state[0].nombre).toBe("Fideos Moñita");
    expect(state[0].precio).toBe(52);
    expect(state[0].codigoBarras).toBe("12345");
  });
});
