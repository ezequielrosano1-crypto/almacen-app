import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import golden from "../../test/golden/cashShiftSync.json";
import type { CashShiftCloseUpdate, CashShiftInsert, CashShiftRow } from "../types/db";
import type { ClockOverride, UruguayClock } from "../types/domain";
import type { StorageEntry, StorageShim } from "../types/window";
import { type CashShiftSyncDeps, syncCashShift } from "./cashShiftSync";

vi.mock("./supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

const DIA_1 = "2026-09-14";
const DIA_2 = "2026-09-15";

const ESCENARIOS_PRUEBA = [
  {
    label: "07:59 · antes de apertura",
    fecha: DIA_1,
    horaNumero: 7 + 59 / 60,
    esperado: "CERRADA",
  },
  { label: "08:00 · apertura", fecha: DIA_1, horaNumero: 8, esperado: "ABIERTA" },
  { label: "12:00 · mediodía", fecha: DIA_1, horaNumero: 12, esperado: "ABIERTA" },
  {
    label: "21:59 · antes del cierre",
    fecha: DIA_1,
    horaNumero: 21 + 59 / 60,
    esperado: "ABIERTA",
  },
  { label: "22:00 · cierre automático", fecha: DIA_1, horaNumero: 22, esperado: "CERRADA" },
  { label: "23:00 · después del cierre", fecha: DIA_1, horaNumero: 23, esperado: "CERRADA" },
  {
    label: "08:00 día siguiente · nueva jornada",
    fecha: DIA_2,
    horaNumero: 8,
    esperado: "ABIERTA",
  },
];

function createFakeStorage(): {
  storage: Pick<StorageShim, "get" | "set">;
  map: Map<string, string>;
} {
  const map = new Map<string, string>();
  const storage: Pick<StorageShim, "get" | "set"> = {
    async get(key: string, shared = false): Promise<StorageEntry> {
      const val = map.get(key);
      if (val !== undefined) {
        return { key, value: val, shared };
      }
      throw new Error(`Clave no encontrada: ${key}`);
    },
    async set(key: string, value: string, shared = false): Promise<StorageEntry> {
      map.set(key, value);
      return { key, value, shared };
    },
  };
  return { storage, map };
}

function createFakeRepository() {
  const shifts = new Map<string, CashShiftRow>();
  const repository = {
    shifts,
    async findShiftByDate(date: string): Promise<CashShiftRow | null> {
      for (const s of shifts.values()) {
        if (s.fecha === date && s.negocio_id === 1) {
          return { ...s };
        }
      }
      return null;
    },
    async closeShift(id: string, payload: CashShiftCloseUpdate): Promise<void> {
      const existing = shifts.get(id);
      if (existing) {
        shifts.set(id, { ...existing, ...payload });
      }
    },
    async createShift(row: CashShiftInsert): Promise<CashShiftRow> {
      const created: CashShiftRow = {
        ...row,
        updated_at: new Date().toISOString(),
      };
      shifts.set(created.id, created);
      return created;
    },
  };
  return repository;
}

function fakeNow(override?: ClockOverride): UruguayClock {
  if (override) {
    const hh = String(Math.floor(override.hourNumber)).padStart(2, "0");
    const mm = String(Math.round((override.hourNumber % 1) * 60)).padStart(2, "0");
    return { date: override.date, time: `${hh}:${mm}`, hourNumber: override.hourNumber };
  }
  return { date: DIA_1, time: "12:00", hourNumber: 12 };
}

describe("syncCashShift unit tests with injected deps (parity with goldens)", () => {
  let fakeRepo: ReturnType<typeof createFakeRepository>;
  let fakeStore: ReturnType<typeof createFakeStorage>;
  let deps: CashShiftSyncDeps;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeRepo = createFakeRepository();
    fakeStore = createFakeStorage();
    deps = {
      repository: fakeRepo,
      storage: fakeStore.storage,
      now: fakeNow,
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("runs the 7 sandbox scenarios in sequence matching golden snapshot", async () => {
    const results = [];
    for (const esc of ESCENARIOS_PRUEBA) {
      const res = await syncCashShift(
        [],
        {
          override: { date: esc.fecha, hourNumber: esc.horaNumero },
          storageKey: "caja:jornada:test",
        },
        deps,
      );
      results.push({ scenario: esc.label, result: res });
    }

    expect(results).toEqual(golden.sandboxSequence);
  });

  it("verifies 3x idempotence run at 12:00 produces identical results", async () => {
    const options = {
      override: { date: DIA_1, hourNumber: 12 },
      storageKey: "caja:jornada:test",
    };
    const r1 = await syncCashShift([], options, deps);
    const r2 = await syncCashShift([], options, deps);
    const r3 = await syncCashShift([], options, deps);

    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    expect(r1?.estado).toBe("ABIERTA");
  });

  it("verifies never-reopen-by-status rule", async () => {
    await syncCashShift(
      [],
      { override: { date: DIA_1, hourNumber: 9 }, storageKey: "caja:jornada:test" },
      deps,
    );

    const manuallyClosed = {
      id: `caja-${DIA_1}`,
      fecha: DIA_1,
      estado: "CERRADA",
      horaApertura: "09:00",
      horaCierre: "15:00",
      cerradoAutomaticamente: false,
    };
    await deps.storage.set("caja:jornada:test", JSON.stringify(manuallyClosed));

    const resAt16 = await syncCashShift(
      [],
      { override: { date: DIA_1, hourNumber: 16 }, storageKey: "caja:jornada:test" },
      deps,
    );

    expect(resAt16?.estado).toBe("CERRADA");
    expect(resAt16?.horaCierre).toBe("15:00");
    expect(resAt16?.cerradoAutomaticamente).toBe(false);
  });

  it("verifies production flow and pins bug #11", async () => {
    const movimientos = [
      { tipo: "venta", fecha: new Date(`${DIA_1}T10:00:00`), total: 100 },
      { tipo: "venta", fecha: DIA_1, total: 250 },
    ];

    const openRes = await syncCashShift(
      movimientos,
      { override: { date: DIA_1, hourNumber: 9 } },
      deps,
    );
    expect(openRes?.estado).toBe("ABIERTA");
    expect(fakeRepo.shifts.has(`caja-${DIA_1}`)).toBe(true);

    const closeRes = await syncCashShift(
      movimientos,
      { override: { date: DIA_1, hourNumber: 22 } },
      deps,
    );
    expect(closeRes?.estado).toBe("CERRADA");

    const shiftInRepo = fakeRepo.shifts.get(`caja-${DIA_1}`);
    expect(shiftInRepo?.estado).toBe("CERRADA");
    expect(shiftInRepo?.hora_cierre).toBe("22:00");
    expect(shiftInRepo?.cerrado_automatico).toBe(true);
    expect(shiftInRepo?.total).toBe(350);
    expect(shiftInRepo?.cantidad_ventas).toBe(2);

    // Pin bug #11: In production, storage is never written
    expect(fakeStore.map.has(`cierre:${DIA_1}`)).toBe(false);
  });
});
