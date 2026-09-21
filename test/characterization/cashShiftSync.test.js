import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Supabase mock store
let supabaseShifts = new Map();

vi.mock("../../src/data/supabaseClient", () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table !== "jornada") throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => {
          const filters = {};
          const chain = {
            eq: vi.fn((col, val) => {
              filters[col] = val;
              return chain;
            }),
            maybeSingle: vi.fn(async () => {
              for (const s of supabaseShifts.values()) {
                if (
                  (filters.negocio_id === undefined || s.negocio_id === filters.negocio_id) &&
                  (filters.fecha === undefined || s.fecha === filters.fecha) &&
                  (filters.id === undefined || s.id === filters.id)
                ) {
                  return { data: { ...s }, error: null };
                }
              }
              return { data: null, error: null };
            }),
            single: vi.fn(async () => {
              const res = await chain.maybeSingle();
              if (!res.data) return { data: null, error: new Error("Not found") };
              return res;
            }),
          };
          return chain;
        }),
        update: vi.fn((payload) => {
          const filters = {};
          const applyUpdate = () => {
            for (const [id, s] of supabaseShifts.entries()) {
              if (
                (filters.negocio_id === undefined || s.negocio_id === filters.negocio_id) &&
                (filters.id === undefined || s.id === filters.id)
              ) {
                supabaseShifts.set(id, { ...s, ...payload });
              }
            }
            return { error: null };
          };

          return {
            eq: vi.fn((col1, val1) => {
              filters[col1] = val1;
              return {
                eq: vi.fn(async (col2, val2) => {
                  filters[col2] = val2;
                  return applyUpdate();
                }),
              };
            }),
          };
        }),
        insert: vi.fn((payload) => {
          const inserted = { ...payload };
          supabaseShifts.set(inserted.id, inserted);
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { ...inserted }, error: null })),
            })),
          };
        }),
      };
    }),
  },
}));

import { sincronizarCaja } from "../legacy/cashShiftSync.js";

const goldenPath = resolve(__dirname, "../golden/cashShiftSync.json");

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

describe("sincronizarCaja legacy characterization & goldens", () => {
  let memoryStorage;
  let consoleSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-21T12:00:00.000Z"));
    supabaseShifts = new Map();
    memoryStorage = new Map();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    globalThis.window = {
      storage: {
        get: vi.fn(async (key) => {
          if (memoryStorage.has(key)) {
            return { key, value: memoryStorage.get(key), shared: false };
          }
          throw new Error(`Clave no encontrada: ${key}`);
        }),
        set: vi.fn(async (key, value) => {
          memoryStorage.set(key, value);
          return { key, value, shared: false };
        }),
        delete: vi.fn(async (key) => {
          const deleted = memoryStorage.delete(key);
          return { key, deleted, shared: false };
        }),
        list: vi.fn(async (prefix = "") => {
          const keys = Array.from(memoryStorage.keys()).filter((k) => k.startsWith(prefix));
          return { keys, prefix, shared: false };
        }),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleSpy.mockRestore();
  });

  it("characterizes the 7 sandbox scenarios executed in sequence (matching PruebasCaja)", async () => {
    const results = [];
    for (const esc of ESCENARIOS_PRUEBA) {
      const res = await sincronizarCaja([], {
        override: { fecha: esc.fecha, horaNumero: esc.horaNumero },
        storageKey: "caja:jornada:test",
      });
      results.push({
        label: esc.label,
        fecha: esc.fecha,
        horaNumero: esc.horaNumero,
        estado: res?.estado ?? null,
        cerradoAutomaticamente: res?.cerradoAutomaticamente ?? null,
        horaApertura: res?.horaApertura ?? null,
        horaCierre: res?.horaCierre ?? null,
      });
    }

    // In sequence starting from empty storage:
    // 07:59 -> null (no existing shift, outside hours)
    expect(results[0].estado).toBeNull();
    // 08:00 -> ABIERTA
    expect(results[1].estado).toBe("ABIERTA");
    expect(results[1].horaApertura).toBe("08:00");
    // 12:00 -> ABIERTA
    expect(results[2].estado).toBe("ABIERTA");
    // 21:59 -> ABIERTA
    expect(results[3].estado).toBe("ABIERTA");
    // 22:00 -> CERRADA (auto-closed)
    expect(results[4].estado).toBe("CERRADA");
    expect(results[4].cerradoAutomaticamente).toBe(true);
    expect(results[4].horaCierre).toBe("22:00");
    // 23:00 -> CERRADA
    expect(results[5].estado).toBe("CERRADA");
    // 08:00 day 2 -> ABIERTA (new day)
    expect(results[6].estado).toBe("ABIERTA");
    expect(results[6].horaApertura).toBe("08:00");

    // Also check sandbox written keys
    expect(memoryStorage.has("caja:jornada:test")).toBe(true);
    expect(memoryStorage.has(`caja:jornada:test:cierre:${DIA_1}`)).toBe(true);
  });

  it("characterizes 3x idempotence run at 12:00", async () => {
    const override = { fecha: DIA_1, horaNumero: 12 };
    const r1 = await sincronizarCaja([], { override, storageKey: "caja:jornada:test" });
    const r2 = await sincronizarCaja([], { override, storageKey: "caja:jornada:test" });
    const r3 = await sincronizarCaja([], { override, storageKey: "caja:jornada:test" });

    expect(r1).toEqual(r2);
    expect(r2).toEqual(r3);
    expect(r1.estado).toBe("ABIERTA");
  });

  it("characterizes the never-reopen-by-status rule (closed shift within hours is not reopened)", async () => {
    // Open shift at 09:00
    await sincronizarCaja([], {
      override: { fecha: DIA_1, horaNumero: 9 },
      storageKey: "caja:jornada:test",
    });

    // Manually close shift at 15:00
    const manuallyClosed = {
      id: `caja-${DIA_1}`,
      fecha: DIA_1,
      estado: "CERRADA",
      horaApertura: "09:00",
      horaCierre: "15:00",
      cerradoAutomaticamente: false,
    };
    await globalThis.window.storage.set("caja:jornada:test", JSON.stringify(manuallyClosed));

    // Next sync at 16:00 (inside 8-22 window)
    const resAt16 = await sincronizarCaja([], {
      override: { fecha: DIA_1, horaNumero: 16 },
      storageKey: "caja:jornada:test",
    });

    // Remains closed, NOT reopened
    expect(resAt16.estado).toBe("CERRADA");
    expect(resAt16.horaCierre).toBe("15:00");
    expect(resAt16.cerradoAutomaticamente).toBe(false);
  });

  it("characterizes auto-close with movements summing and browser localDateKey (bug #7)", async () => {
    // Open shift on DIA_1
    await sincronizarCaja([], {
      override: { fecha: DIA_1, horaNumero: 10 },
      storageKey: "caja:jornada:test",
    });

    const movimientos = [
      { tipo: "venta", fecha: new Date(`${DIA_1}T11:00:00`), total: 150 },
      { tipo: "venta", fecha: DIA_1, total: 350.5 },
      { tipo: "entrada", fecha: new Date(`${DIA_1}T12:00:00`), total: 500 }, // Ignored (tipo !== venta)
      { tipo: "venta", fecha: new Date(`${DIA_2}T10:00:00`), total: 200 }, // Ignored (different date)
    ];

    // Trigger auto-close at 22:00
    const closed = await sincronizarCaja(movimientos, {
      override: { fecha: DIA_1, horaNumero: 22 },
      storageKey: "caja:jornada:test",
    });

    expect(closed.estado).toBe("CERRADA");
    expect(closed.cerradoAutomaticamente).toBe(true);
    expect(closed.horaCierre).toBe("22:00");

    // In sandbox, cierre summary is stored
    const summaryEntry = await globalThis.window.storage.get(`caja:jornada:test:cierre:${DIA_1}`);
    const summary = JSON.parse(summaryEntry.value);
    expect(summary.total).toBe(500.5);
    expect(summary.cantidadVentas).toBe(2);
    expect(summary.automatico).toBe(true);
  });

  it("characterizes production Supabase branch and pins bug #11 (never writes cierre:<date> to storage)", async () => {
    const movimientos = [
      { tipo: "venta", fecha: new Date(`${DIA_1}T10:00:00`), total: 100 },
      { tipo: "venta", fecha: DIA_1, total: 250 },
    ];

    // 1. Open shift in production (default storageKey: "caja:jornada")
    const openRes = await sincronizarCaja(movimientos, {
      override: { fecha: DIA_1, horaNumero: 9 },
    });
    expect(openRes.estado).toBe("ABIERTA");
    expect(supabaseShifts.has(`caja-${DIA_1}`)).toBe(true);

    // 2. Auto-close at 22:00
    const closeRes = await sincronizarCaja(movimientos, {
      override: { fecha: DIA_1, horaNumero: 22 },
    });
    expect(closeRes.estado).toBe("CERRADA");

    const shiftInDb = supabaseShifts.get(`caja-${DIA_1}`);
    expect(shiftInDb.estado).toBe("CERRADA");
    expect(shiftInDb.hora_cierre).toBe("22:00");
    expect(shiftInDb.cerrado_automatico).toBe(true);
    expect(shiftInDb.total).toBe(350);
    expect(shiftInDb.cantidad_ventas).toBe(2);

    // Pin bug #11: In production, window.storage.set was NEVER called for cierre:<fecha>
    expect(globalThis.window.storage.set).not.toHaveBeenCalled();
    expect(memoryStorage.has(`cierre:${DIA_1}`)).toBe(false);
  });

  it("generates and verifies frozen golden snapshot", async () => {
    // Generate full scenario runs for goldens
    const goldenData = {};

    // 1. Sandbox sequence
    const sandboxSeq = [];
    for (const esc of ESCENARIOS_PRUEBA) {
      const res = await sincronizarCaja([], {
        override: { fecha: esc.fecha, horaNumero: esc.horaNumero },
        storageKey: "caja:jornada:test",
      });
      sandboxSeq.push({ scenario: esc.label, result: res });
    }
    goldenData.sandboxSequence = sandboxSeq;

    // 2. Production sequence with sales
    supabaseShifts.clear();
    const prodMovs = [
      { tipo: "venta", fecha: new Date(`${DIA_1}T10:00:00`), total: 120 },
      { tipo: "venta", fecha: DIA_1, total: 80 },
    ];
    const prodOpen = await sincronizarCaja(prodMovs, {
      override: { fecha: DIA_1, horaNumero: 10 },
    });
    const prodClose = await sincronizarCaja(prodMovs, {
      override: { fecha: DIA_1, horaNumero: 22 },
    });
    goldenData.productionFlow = {
      open: prodOpen,
      close: prodClose,
      dbState: Object.fromEntries(supabaseShifts),
    };

    writeFileSync(goldenPath, `${JSON.stringify(goldenData, null, 2)}\n`, "utf-8");

    const frozen = JSON.parse(readFileSync(goldenPath, "utf-8"));
    expect(goldenData).toEqual(frozen);
  });
});
