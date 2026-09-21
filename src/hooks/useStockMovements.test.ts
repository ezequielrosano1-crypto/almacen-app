import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { applyStockMovement, recordStockMovementToRepository } from "./useStockMovements";

describe("useStockMovements pure functions and repository interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applyStockMovement prepends movement to existing list", () => {
    const existing = [{ id: 100, tipo: "venta" }];
    const nuevo = { id: 101, tipo: "entrada" };
    const result = applyStockMovement(existing, nuevo);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(nuevo);
    expect(result[1]).toEqual(existing[0]);
  });

  it("calls insertStockEntry when tipo is 'entrada'", async () => {
    const mockInsert = vi.fn().mockResolvedValue(undefined);
    const date = new Date("2026-09-21T12:00:00.000Z");

    const ok = await recordStockMovementToRepository(
      {
        tipo: "entrada",
        productoId: 42,
        cantidad: 10,
        unidad: "kg",
      },
      date,
      { insertStockEntry: mockInsert },
    );

    expect(ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      negocio_id: 1,
      producto_id: 42,
      jornada_id: null,
      fecha: date.toISOString(),
      tipo: "entrada",
      cantidad: 10,
      unidad: "kg",
      diferencia: 10,
      motivo: "Entrada de stock",
    });
  });

  it("pins bug #3: does NOT call insertStockEntry when tipo is 'ajuste'", async () => {
    const mockInsert = vi.fn().mockResolvedValue(undefined);
    const date = new Date("2026-09-21T12:00:00.000Z");

    const ok = await recordStockMovementToRepository(
      {
        tipo: "ajuste",
        productoId: 42,
        diferencia: -3,
        motivo: "Vencimiento",
      },
      date,
      { insertStockEntry: mockInsert },
    );

    expect(ok).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("handles failure of insertStockEntry gracefully and returns false", async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error("Supabase insert error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const date = new Date("2026-09-21T12:00:00.000Z");

    const ok = await recordStockMovementToRepository(
      {
        tipo: "entrada",
        productoId: 10,
        cantidad: 5,
        unidad: "unidad",
      },
      date,
      { insertStockEntry: mockInsert },
    );

    expect(ok).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
