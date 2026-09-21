import { describe, expect, it, vi } from "vitest";
import type { StockMovementRow } from "../types/db";
import type { MovementRecordItem } from "../types/domain";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { handleStockMovementRealtimeInsert } from "./useStockMovementsRealtime";

const payload: StockMovementRow = {
  id: 99,
  negocio_id: 1,
  jornada_id: null,
  fecha: "2026-09-21T12:00:00.000Z",
  tipo: "entrada",
  producto_id: 1,
  producto_nombre: "Yerba",
  cantidad: 5,
  unidad: "unidad",
  diferencia: 5,
  motivo: "Entrada de stock",
};

function harness(initial: MovementRecordItem[]) {
  let state = initial;
  const setMovements = (updater: (prev: MovementRecordItem[]) => MovementRecordItem[]) => {
    state = updater(state);
  };
  return { setMovements, get: () => state };
}

describe("useStockMovementsRealtime / pure handlers", () => {
  it("prepends a movement made on another device, with its product name", () => {
    const h = harness([{ id: 1, tipo: "entrada", fecha: new Date() }]);

    handleStockMovementRealtimeInsert(payload, h.setMovements);

    expect(h.get()).toHaveLength(2);
    expect(h.get()[0]).toMatchObject({ id: 99, producto: "Yerba", cantidad: 5, diferencia: 5 });
  });

  it("handles ajustes too, keeping the server-computed difference", () => {
    const h = harness([]);

    handleStockMovementRealtimeInsert(
      { ...payload, id: 100, tipo: "ajuste", cantidad: 3, diferencia: -2, motivo: "Rotura" },
      h.setMovements,
    );

    expect(h.get()[0]).toMatchObject({ tipo: "ajuste", diferencia: -2, motivo: "Rotura" });
  });

  it("bug #2 fixed: the echo of a movement already in the list is not added again", () => {
    const h = harness([{ id: 99, tipo: "entrada", fecha: new Date(), producto: "Yerba" }]);

    handleStockMovementRealtimeInsert(payload, h.setMovements);

    expect(h.get()).toHaveLength(1);
  });

  it("ignores movements with tipo 'venta' (sales come from the ventas channel)", () => {
    const h = harness([{ id: 1, tipo: "entrada", fecha: new Date() }]);

    handleStockMovementRealtimeInsert({ ...payload, id: 2, tipo: "venta" }, h.setMovements);

    expect(h.get()).toHaveLength(1);
  });

  it("ignores empty payloads", () => {
    const h = harness([]);

    handleStockMovementRealtimeInsert(null, h.setMovements);

    expect(h.get()).toHaveLength(0);
  });
});
