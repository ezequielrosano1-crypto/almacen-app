import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisterStockMovementResult, StockMovementRow } from "../types/db";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

import { applyStockMovement, recordStockMovementToRepository } from "./useStockMovements";

const row = (over: Partial<StockMovementRow>): StockMovementRow => ({
  id: 1,
  negocio_id: 1,
  producto_id: 42,
  producto_nombre: "Yerba",
  jornada_id: null,
  fecha: "2026-09-21T12:00:00+00:00",
  tipo: "entrada",
  cantidad: 10,
  unidad: "kg",
  diferencia: 10,
  motivo: "Entrada de stock",
  ...over,
});

const result = (over: Partial<StockMovementRow> = {}, stock = 20): RegisterStockMovementResult => ({
  movimiento: row(over),
  stock,
});

describe("applyStockMovement", () => {
  it("prepends the movement to the existing list", () => {
    const existing = [{ id: 100, tipo: "venta" }];
    const nuevo = { id: 101, tipo: "entrada" };

    expect(applyStockMovement(existing, nuevo)).toEqual([nuevo, existing[0]]);
  });

  it("does not add the same movement twice (own insert + realtime echo, bug #2)", () => {
    const first = applyStockMovement([], { id: 5, tipo: "entrada" });
    const again = applyStockMovement(first, { id: 5, tipo: "entrada" });

    expect(again).toHaveLength(1);
  });

  it("never dedupes across kinds: sales and stock movements have separate id spaces", () => {
    const withSale = [{ id: 5, tipo: "venta" }];
    const result = applyStockMovement(withSale, { id: 5, tipo: "entrada" });

    expect(result).toHaveLength(2);
  });
});

describe("recordStockMovementToRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("entrada: registers the units added and returns the server result", async () => {
    const register = vi.fn().mockResolvedValue(result());

    const saved = await recordStockMovementToRepository(
      { tipo: "entrada", productoId: 42, cantidad: 10, unidad: "kg" },
      { registerStockMovement: register },
    );

    expect(register).toHaveBeenCalledWith({
      producto_id: 42,
      tipo: "entrada",
      cantidad: 10,
      motivo: null,
    });
    expect(saved?.stock).toBe(20);
  });

  it("ajuste (bug #3 fixed): is persisted through the same RPC with the counted stock and reason", async () => {
    const register = vi
      .fn()
      .mockResolvedValue(result({ tipo: "ajuste", cantidad: 3, diferencia: -3 }, 3));

    const saved = await recordStockMovementToRepository(
      { tipo: "ajuste", productoId: 42, cantidad: 3, motivo: "Vencimiento" },
      { registerStockMovement: register },
    );

    expect(register).toHaveBeenCalledWith({
      producto_id: 42,
      tipo: "ajuste",
      cantidad: 3,
      motivo: "Vencimiento",
    });
    expect(saved?.movimiento.tipo).toBe("ajuste");
  });

  it("accepts the English aliases used by some callers", async () => {
    const register = vi.fn().mockResolvedValue(result());

    await recordStockMovementToRepository(
      { type: "ajuste", productId: 7, quantity: 2, reason: "Rotura" },
      { registerStockMovement: register },
    );

    expect(register).toHaveBeenCalledWith({
      producto_id: 7,
      tipo: "ajuste",
      cantidad: 2,
      motivo: "Rotura",
    });
  });

  it("returns null without calling the server for unsupported types or a missing product", async () => {
    const register = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await recordStockMovementToRepository(
        { tipo: "venta", productoId: 1, cantidad: 1 },
        { registerStockMovement: register },
      ),
    ).toBeNull();
    expect(
      await recordStockMovementToRepository(
        { tipo: "entrada", cantidad: 1 },
        { registerStockMovement: register },
      ),
    ).toBeNull();
    expect(register).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns null and logs when the server rejects the movement", async () => {
    const register = vi.fn().mockRejectedValue(new Error("Supabase error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const saved = await recordStockMovementToRepository(
      { tipo: "entrada", productoId: 10, cantidad: 5 },
      { registerStockMovement: register },
    );

    expect(saved).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
