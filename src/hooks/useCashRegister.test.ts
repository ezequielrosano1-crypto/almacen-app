import { describe, expect, it, vi } from "vitest";
import type { CashShiftReopenUpdate, CashShiftRow } from "../types/db";
import type { ClockOverride, UruguayClock } from "../types/domain";
import type { StorageShim } from "../types/window";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { openCashShift } from "./useCashRegister";

const DIA_TEST = "2026-09-14";

function fakeClock(hourNumber: number): (override?: ClockOverride) => UruguayClock {
  return () => {
    const hh = String(Math.floor(hourNumber)).padStart(2, "0");
    const mm = String(Math.round((hourNumber % 1) * 60)).padStart(2, "0");
    return { date: DIA_TEST, time: `${hh}:${mm}`, hourNumber };
  };
}

describe("useCashRegister & pure openCashShift", () => {
  it("opens cash shift inside schedule (10:00) via reopenShift", async () => {
    const mockReopen = vi.fn(
      async (id: string, payload: CashShiftReopenUpdate): Promise<CashShiftRow> => ({
        id,
        negocio_id: 1,
        fecha: DIA_TEST,
        estado: payload.estado,
        hora_apertura: payload.hora_apertura,
        hora_cierre: payload.hora_cierre,
        cerrado_automatico: payload.cerrado_automatico,
        total: 0,
        cantidad_ventas: 0,
        updated_at: payload.updated_at,
      }),
    );

    const mockStorageDelete = vi.fn();
    const fakeStorage = {
      delete: mockStorageDelete,
    } as unknown as StorageShim;

    const deps = {
      reopenShift: mockReopen,
      now: fakeClock(10),
      storage: fakeStorage,
    };

    const res = await openCashShift(deps);

    expect(res).toBeTruthy();
    expect(res?.estado).toBe("ABIERTA");
    expect(res?.horaApertura).toBe("10:00");
    expect(res?.horaCierre).toBeNull();
    expect(res?.cerradoAutomaticamente).toBe(false);

    expect(mockReopen).toHaveBeenCalledTimes(1);
    expect(mockReopen).toHaveBeenCalledWith(
      `caja-${DIA_TEST}`,
      expect.objectContaining({
        estado: "ABIERTA",
        hora_apertura: "10:00",
        hora_cierre: null,
        cerrado_automatico: false,
      }),
    );

    // Pin bug #12: No storage delete is issued even though legacy comments claimed it cleared cierre
    expect(mockStorageDelete).not.toHaveBeenCalled();
  });

  it("returns null outside schedule (07:59 and 22:00)", async () => {
    const mockReopen = vi.fn();

    // 07:59
    const resEarly = await openCashShift({
      reopenShift: mockReopen,
      now: fakeClock(7 + 59 / 60),
    });
    expect(resEarly).toBeNull();

    // 22:00
    const resLate = await openCashShift({
      reopenShift: mockReopen,
      now: fakeClock(22),
    });
    expect(resLate).toBeNull();

    // 23:30
    const resNight = await openCashShift({
      reopenShift: mockReopen,
      now: fakeClock(23.5),
    });
    expect(resNight).toBeNull();

    expect(mockReopen).not.toHaveBeenCalled();
  });

  it("handles schedule boundaries (08:00 opens, 21:59 opens)", async () => {
    const mockReopen = vi.fn(
      async (id: string, payload: CashShiftReopenUpdate): Promise<CashShiftRow> => ({
        id,
        negocio_id: 1,
        fecha: DIA_TEST,
        estado: payload.estado,
        hora_apertura: payload.hora_apertura,
        hora_cierre: payload.hora_cierre,
        cerrado_automatico: payload.cerrado_automatico,
        total: 0,
        cantidad_ventas: 0,
        updated_at: payload.updated_at,
      }),
    );

    // Exactly 08:00
    const resAt8 = await openCashShift({
      reopenShift: mockReopen,
      now: fakeClock(8),
    });
    expect(resAt8?.estado).toBe("ABIERTA");
    expect(resAt8?.horaApertura).toBe("08:00");

    // At 21:59
    const resAt2159 = await openCashShift({
      reopenShift: mockReopen,
      now: fakeClock(21 + 59 / 60),
    });
    expect(resAt2159?.estado).toBe("ABIERTA");
    expect(resAt2159?.horaApertura).toBe("21:59");
  });
});
