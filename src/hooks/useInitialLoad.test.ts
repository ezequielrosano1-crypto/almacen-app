import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { runInitialLoad } from "./useInitialLoad";

describe("useInitialLoad / runInitialLoad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes the sequential steps and sets loaded to true", async () => {
    const callOrder: string[] = [];

    const mockListProducts = vi.fn(async () => {
      callOrder.push("listProducts");
      return [
        {
          id: 1,
          nombre: "Yerba",
          precio: 100,
          unidad: "unidad",
          stock: 5,
          stock_minimo: 2,
          codigo_barras: "123",
        },
      ];
    });

    const mockReadJson = vi.fn(async (key: string) => {
      callOrder.push(`readJson:${key}`);
      if (key === "datos:movimientos") {
        return [{ id: 10, tipo: "ajuste", fecha: "2026-09-20T10:00:00.000Z" }];
      }
      if (key === "datos:infoNegocio") {
        return { nombre: "Mi Almacén", contacto: "099 000 111" };
      }
      return null;
    });

    const mockListSales = vi.fn(async () => {
      callOrder.push("listSalesWithItems");
      return [
        {
          id: 20,
          fecha: "2026-09-21T11:00:00.000Z",
          total: 200,
          pago: "Efectivo",
          venta_items: [
            {
              producto_id: 1,
              nombre: "Yerba",
              cantidad: 2,
              unidad: "unidad",
              precio_unitario: 100,
              subtotal: 200,
            },
          ],
        },
      ];
    });

    const setProducts = vi.fn();
    const setStockMovements = vi.fn();
    const setBusinessInfo = vi.fn();
    const setLoaded = vi.fn();

    await runInitialLoad(
      {
        isActive: () => true,
        setProducts,
        setStockMovements,
        setBusinessInfo,
        setLoaded,
      },
      {
        listProducts: mockListProducts as any,
        readJson: mockReadJson as any,
        listSalesWithItems: mockListSales as any,
      },
    );

    expect(callOrder).toEqual([
      "listProducts",
      "readJson:datos:movimientos",
      "listSalesWithItems",
      "readJson:datos:infoNegocio",
    ]);

    expect(setProducts).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 1, nombre: "Yerba", precio: 100 })]),
    );

    expect(setStockMovements).toHaveBeenCalledTimes(2); // once for stored movs, once for sales
    expect(setBusinessInfo).toHaveBeenCalledWith({
      nombre: "Mi Almacén",
      contacto: "099 000 111",
    });
    expect(setLoaded).toHaveBeenCalledWith(true);
  });

  it("does not update state if isActive is false", async () => {
    const mockListProducts = vi.fn(async () => [
      { id: 1, nombre: "Yerba", precio: 100, unidad: "un", stock: 5, stock_minimo: 1 },
    ]);
    const mockReadJson = vi.fn(async () => ({}));
    const mockListSales = vi.fn(async () => []);

    const setProducts = vi.fn();
    const setStockMovements = vi.fn();
    const setBusinessInfo = vi.fn();
    const setLoaded = vi.fn();

    await runInitialLoad(
      {
        isActive: () => false,
        setProducts,
        setStockMovements,
        setBusinessInfo,
        setLoaded,
      },
      {
        listProducts: mockListProducts as any,
        readJson: mockReadJson as any,
        listSalesWithItems: mockListSales as any,
      },
    );

    expect(setProducts).not.toHaveBeenCalled();
    expect(setStockMovements).not.toHaveBeenCalled();
    expect(setBusinessInfo).not.toHaveBeenCalled();
    expect(setLoaded).not.toHaveBeenCalled();
  });
});
