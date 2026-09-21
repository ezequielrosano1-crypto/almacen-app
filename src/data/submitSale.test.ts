import { describe, expect, it, vi } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { type SubmitSaleDeps, type SubmitSaleInput, submitSale } from "./submitSale";

describe("submitSale I/O orchestration and bug #5 pinning", () => {
  const mockInput: SubmitSaleInput = {
    total: 350,
    pago: "Efectivo",
    items: [
      {
        cantidad: 1,
        subtotal: 190,
        producto: { id: 1, nombre: "Yerba", unidad: "unidad", precio: 190, stock: 10 },
      },
      {
        cantidad: 2,
        subtotal: 160,
        producto: { id: 2, nombre: "Manzanas", unidad: "kg", precio: 80, stock: 5 },
      },
    ],
  };

  it("happy path: creates sale, inserts items, and updates stock for each item in order", async () => {
    const calls: string[] = [];
    const deps: SubmitSaleDeps = {
      createSale: vi.fn(async (params) => {
        calls.push(`createSale:${params.total}:${params.pago}`);
        return {
          id: 123,
          negocio_id: params.negocio_id,
          jornada_id: params.jornada_id,
          fecha: params.fecha,
          total: params.total,
          pago: params.pago,
        };
      }),
      insertSaleItems: vi.fn(async (items) => {
        calls.push(`insertSaleItems:${items.length}`);
      }),
      deleteSale: vi.fn(async (_id) => {
        calls.push("deleteSale");
      }),
      updateProductStock: vi.fn(async (id, stock) => {
        calls.push(`updateStock:${id}:${stock}`);
      }),
    };

    const result = await submitSale(mockInput, deps);

    expect(result.id).toBe(123);
    expect(calls).toEqual([
      "createSale:350:Efectivo",
      "insertSaleItems:2",
      "updateStock:1:9",
      "updateStock:2:3",
    ]);
    expect(deps.deleteSale).not.toHaveBeenCalled();
  });

  it("items failure: rolls back created sale with deleteSale and rethrows error without updating stock", async () => {
    const deps: SubmitSaleDeps = {
      createSale: vi.fn(async (params) => ({
        id: 456,
        negocio_id: params.negocio_id,
        jornada_id: params.jornada_id,
        fecha: params.fecha,
        total: params.total,
        pago: params.pago,
      })),
      insertSaleItems: vi.fn(async () => {
        throw new Error("DB Error on insert items");
      }),
      deleteSale: vi.fn(async () => {}),
      updateProductStock: vi.fn(async () => {}),
    };

    await expect(submitSale(mockInput, deps)).rejects.toThrow("DB Error on insert items");
    expect(deps.deleteSale).toHaveBeenCalledTimes(1);
    expect(deps.deleteSale).toHaveBeenCalledWith(456);
    expect(deps.updateProductStock).not.toHaveBeenCalled();
  });

  it("pins bug #5 (rollback asymmetry): stock update failure on item 2 leaves item 1 updated and issues NO deleteSale", async () => {
    const stockUpdated: { id: number | string; stock: number }[] = [];
    const deps: SubmitSaleDeps = {
      createSale: vi.fn(async (params) => ({
        id: 789,
        negocio_id: params.negocio_id,
        jornada_id: params.jornada_id,
        fecha: params.fecha,
        total: params.total,
        pago: params.pago,
      })),
      insertSaleItems: vi.fn(async () => {}),
      deleteSale: vi.fn(async () => {}),
      updateProductStock: vi.fn(async (id, stock) => {
        if (id === 2) {
          throw new Error("Stock update failed for product 2");
        }
        stockUpdated.push({ id, stock });
      }),
    };

    await expect(submitSale(mockInput, deps)).rejects.toThrow("Stock update failed for product 2");

    // Item 1 was updated and is NOT rolled back
    expect(stockUpdated).toEqual([{ id: 1, stock: 9 }]);
    // Crucially, deleteSale was NOT called (bug #5 preserved)
    expect(deps.deleteSale).not.toHaveBeenCalled();
  });
});
