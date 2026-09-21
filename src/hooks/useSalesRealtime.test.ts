import { describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { handleSaleRealtimeInsert } from "./useSalesRealtime";

const venta = { id: 101, fecha: "2026-09-21T12:05:00.000Z", total: 80, pago: "Débito" };

describe("useSalesRealtime / handleSaleRealtimeInsert", () => {
  it("deduplicates by id against the current state", async () => {
    let state: any[] = [{ id: 100, tipo: "venta", total: 150 }];
    const setMovements = (updater: any) => {
      state = updater(state);
    };
    const fetchItems = vi.fn().mockResolvedValue([
      {
        producto_id: 1,
        nombre: "Yerba",
        cantidad: 1,
        unidad: "un",
        precio_unitario: 150,
        subtotal: 150,
      },
    ]);

    await handleSaleRealtimeInsert({ ...venta, id: 100 }, setMovements, fetchItems as any);
    expect(state).toHaveLength(1);

    await handleSaleRealtimeInsert(venta, setMovements, fetchItems as any);
    expect(state).toHaveLength(2);
    expect(state[0].id).toBe(101);
    expect(state[0].items[0].nombre).toBe("Yerba");
  });

  it("awaits listSaleItems before updating state", async () => {
    let state: any[] = [];
    const setMovements = vi.fn((updater: any) => {
      state = updater(state);
    });
    let resolveItems: (v: any[]) => void = () => {};
    const fetchItems = vi.fn(
      () =>
        new Promise<any[]>((resolve) => {
          resolveItems = resolve;
        }),
    );

    const pending = handleSaleRealtimeInsert(venta, setMovements, fetchItems as any);
    expect(setMovements).not.toHaveBeenCalled();
    resolveItems([]);
    await pending;
    expect(setMovements).toHaveBeenCalledTimes(1);
  });

  it("pins bug #4: items [] yields a sale with empty items", async () => {
    let state: any[] = [];
    const setMovements = (updater: any) => {
      state = updater(state);
    };

    await handleSaleRealtimeInsert(venta, setMovements, vi.fn().mockResolvedValue([]) as any);

    expect(state).toHaveLength(1);
    expect(state[0].items).toEqual([]);
  });
});
