import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CashShiftRow } from "../types/db";
import type { StoredCashShift } from "../types/storage";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

const closedRow: CashShiftRow = {
  id: "caja-2026-09-20",
  negocio_id: 1,
  fecha: "2026-09-20",
  estado: "CERRADA",
  hora_apertura: "08:05:00",
  hora_cierre: "22:00",
  cerrado_automatico: true,
  total: 1250.5,
  cantidad_ventas: 14,
};

describe("closing mappers", () => {
  it("cashShiftRowToClosingSummary maps a closed jornada row", async () => {
    const { cashShiftRowToClosingSummary } = await import("./mappers");

    expect(cashShiftRowToClosingSummary(closedRow)).toEqual({
      date: "2026-09-20",
      time: "22:00",
      total: 1250.5,
      salesCount: 14,
      isAutoClosed: true,
    });
  });

  it("cashShiftRowToClosingSummary shows --:-- when the close time is missing and tolerates null totals", async () => {
    const { cashShiftRowToClosingSummary } = await import("./mappers");

    const summary = cashShiftRowToClosingSummary({
      ...closedRow,
      hora_cierre: null,
      total: null,
      cantidad_ventas: null,
    });

    expect(summary).toMatchObject({ time: "--:--", total: 0, salesCount: 0 });
  });

  it("storedShiftToClosingSummary returns null while the shift is open", async () => {
    const { storedShiftToClosingSummary } = await import("./mappers");
    const open: StoredCashShift = {
      id: "caja-2026-09-21",
      fecha: "2026-09-21",
      estado: "ABIERTA",
      horaApertura: "16:26",
      horaCierre: null,
      cerradoAutomaticamente: false,
    };

    expect(storedShiftToClosingSummary(open)).toBeNull();
    expect(storedShiftToClosingSummary(null)).toBeNull();
  });

  it("storedShiftToClosingSummary builds the summary of a closed shift", async () => {
    const { storedShiftToClosingSummary } = await import("./mappers");
    const closed: StoredCashShift = {
      id: "caja-2026-09-21",
      fecha: "2026-09-21",
      estado: "CERRADA",
      horaApertura: "16:26",
      horaCierre: "19:40",
      cerradoAutomaticamente: false,
      total: 35,
      cantidadVentas: 2,
    };

    expect(storedShiftToClosingSummary(closed)).toEqual({
      date: "2026-09-21",
      time: "19:40",
      total: 35,
      salesCount: 2,
      isAutoClosed: false,
    });
  });
});

describe("cashShiftRepository.listClosedShifts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("selects CERRADA jornadas of negocio 1, newest first", async () => {
    const { listClosedShifts } = await import("./cashShiftRepository");

    const order = vi.fn().mockResolvedValue({ data: [closedRow], error: null });
    const eqEstado = vi.fn().mockReturnValue({ order });
    const eqNegocio = vi.fn().mockReturnValue({ eq: eqEstado });
    const select = vi.fn().mockReturnValue({ eq: eqNegocio });
    vi.mocked(supabase.from).mockReturnValue({ select } as unknown as ReturnType<
      typeof supabase.from
    >);

    const rows = await listClosedShifts();

    expect(supabase.from).toHaveBeenCalledWith("jornada");
    expect(eqNegocio).toHaveBeenCalledWith("negocio_id", 1);
    expect(eqEstado).toHaveBeenCalledWith("estado", "CERRADA");
    expect(order).toHaveBeenCalledWith("fecha", { ascending: false });
    expect(rows).toEqual([closedRow]);
  });

  it("throws the Supabase error", async () => {
    const { listClosedShifts } = await import("./cashShiftRepository");
    const order = vi.fn().mockResolvedValue({ data: null, error: new Error("boom") });
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ order }) }) }),
    } as unknown as ReturnType<typeof supabase.from>);

    await expect(listClosedShifts()).rejects.toThrow("boom");
  });
});

describe("closingsRepository.listClosings", () => {
  it("maps closed jornadas to closing summaries, preserving DB order", async () => {
    const { listClosings } = await import("./closingsRepository");
    const rows = [closedRow, { ...closedRow, fecha: "2026-09-19", cerrado_automatico: false }];
    const listClosedShifts = vi.fn().mockResolvedValue(rows);

    const result = await listClosings({ listClosedShifts });

    expect(result.map((c) => c.date)).toEqual(["2026-09-20", "2026-09-19"]);
    expect(result[1]?.isAutoClosed).toBe(false);
  });

  it("propagates repository errors so the view can show its error state", async () => {
    const { listClosings } = await import("./closingsRepository");
    const listClosedShifts = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(listClosings({ listClosedShifts })).rejects.toThrow("offline");
  });
});
