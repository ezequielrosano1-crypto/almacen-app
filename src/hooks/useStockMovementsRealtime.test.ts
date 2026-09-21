import { describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import {
  handleSaleRealtimeInsert,
  handleStockMovementRealtimeInsert,
} from "./useStockMovementsRealtime";

describe("useStockMovementsRealtime / pure handlers", () => {
  it("pins bug #2: blindly prepends entrada without deduplication (twin duplicated entrada)", () => {
    // Existing list already contains movement 99
    let state = [{ id: 99, tipo: "entrada", productoId: 1, cantidad: 5 }];
    const setMovements = (updater: any) => {
      state = updater(state);
    };

    // Realtime notification arrives with the same id 99 (or duplicate)
    handleStockMovementRealtimeInsert(
      {
        id: 99,
        fecha: "2026-09-21T12:00:00.000Z",
        tipo: "entrada",
        producto_id: 1,
        cantidad: 5,
        unidad: "unidad",
        diferencia: 5,
        motivo: "Entrada de stock",
      },
      setMovements,
    );

    // BUG #2 pinned: state now contains TWO entries with id 99 (duplicated twin entrada)
    expect(state).toHaveLength(2);
    expect(state[0].id).toBe(99);
    expect(state[1].id).toBe(99);
  });

  it("ignores movements with tipo 'venta'", () => {
    let state = [{ id: 1, tipo: "entrada" }];
    const setMovements = (updater: any) => {
      state = updater(state);
    };

    handleStockMovementRealtimeInsert(
      {
        id: 2,
        fecha: "2026-09-21T12:00:00.000Z",
        tipo: "venta",
      },
      setMovements,
    );

    expect(state).toHaveLength(1);
  });

  it("handleSaleRealtimeInsert fetches sale items and deduplicates against state", async () => {
    let state = [{ id: 100, tipo: "venta", total: 150 }];
    const setMovements = (updater: any) => {
      state = updater(state);
    };

    const mockFetchItems = vi.fn().mockResolvedValue([
      {
        producto_id: 1,
        nombre: "Yerba",
        cantidad: 1,
        unidad: "un",
        precio_unitario: 150,
        subtotal: 150,
      },
    ]);

    // Already exists in state -> should NOT be duplicated
    await handleSaleRealtimeInsert(
      { id: 100, fecha: "2026-09-21T12:00:00.000Z", total: 150, pago: "Efectivo" },
      setMovements,
      mockFetchItems as any,
    );
    expect(state).toHaveLength(1);

    // New sale -> should be prepended
    await handleSaleRealtimeInsert(
      { id: 101, fecha: "2026-09-21T12:05:00.000Z", total: 80, pago: "Débito" },
      setMovements,
      mockFetchItems as any,
    );
    expect(state).toHaveLength(2);
    expect(state[0].id).toBe(101);
  });
});
