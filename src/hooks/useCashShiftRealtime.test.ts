import { describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { handleCashShiftRealtimeEvent } from "./useCashShiftRealtime";

const row = {
  id: 7,
  fecha: "2026-09-21",
  estado: "abierta",
  hora_apertura: "08:00",
  hora_cierre: null,
  cerrado_automatico: false,
  total: "120.5",
  cantidad_ventas: "3",
};

function run(prev: any, payload: any) {
  let state = prev;
  handleCashShiftRealtimeEvent(payload, (updater: any) => {
    state = updater(state);
  });
  return state;
}

describe("useCashShiftRealtime / handleCashShiftRealtimeEvent", () => {
  it("maps the row and sets it when there is no previous shift", () => {
    const next = run(null, { new: row });
    expect(next).toEqual({
      id: 7,
      fecha: "2026-09-21",
      estado: "abierta",
      horaApertura: "08:00",
      horaCierre: null,
      cerradoAutomaticamente: false,
      total: 120.5,
      cantidadVentas: 3,
    });
  });

  it("updates when prev.id equals next.id", () => {
    const next = run({ id: 7, total: 0 }, { new: row });
    expect(next.total).toBe(120.5);
  });

  it("ignores the event when prev exists and prev.id differs", () => {
    const prev = { id: 6, total: 10 };
    expect(run(prev, { new: row })).toBe(prev);
  });

  it("does nothing when payload.new is missing (DELETE)", () => {
    const setter = vi.fn();
    handleCashShiftRealtimeEvent({ new: null } as any, setter);
    expect(setter).not.toHaveBeenCalled();
  });
});
