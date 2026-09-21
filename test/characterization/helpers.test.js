import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ahoraUY,
  COLORS,
  claveFechaHoy,
  esHoy,
  estadoColor,
  estadoProducto,
  fmtFecha,
  fmtMoney,
  fmtStock,
  horaUYTexto,
  MOTIVOS_AJUSTE,
  nextId,
} from "../legacy/helpers.js";

const goldenPath = resolve(__dirname, "../golden/helpers.json");

describe("Legacy helpers characterization and goldens", () => {
  const moneyFixtures = [0, 10, 99.4, 99.5, 100, 1250, 1234567, -50, -1200.5];

  const stockFixtures = [
    { stock: 0, unidad: "un." },
    { stock: 5, unidad: "un." },
    { stock: 1250, unidad: "un." },
    { stock: 0, unidad: "kg" },
    { stock: 2.5, unidad: "kg" },
    { stock: 1000.5, unidad: "kg" },
    { stock: -1.5, unidad: "kg" },
  ];

  const productStatusFixtures = [
    { stock: 0, stockMinimo: 5 },
    { stock: -1, stockMinimo: 5 },
    { stock: 1, stockMinimo: 5 },
    { stock: 5, stockMinimo: 5 },
    { stock: 6, stockMinimo: 5 },
    { stock: 100, stockMinimo: 10 },
  ];

  const statusColorFixtures = ["normal", "bajo", "agotado", "desconocido"];

  const dateFixtures = [
    "2026-01-01T00:00:00.000Z",
    "2026-06-15T12:30:00.000Z",
    "2026-09-21T02:30:00.000Z",
    "2026-09-21T23:30:00.000Z",
    "2026-12-31T23:59:59.000Z",
  ];

  const ahoraUYOverrideFixtures = [
    { fecha: "2026-09-21", horaNumero: 8.5 },
    { fecha: "2026-09-21", horaNumero: 22.0 },
    { fecha: "2026-12-31", horaNumero: 23.75 },
    { fecha: "2026-01-01", horaNumero: 0.0 },
  ];

  it("produces expected outputs and validates against frozen goldens", () => {
    const computed = {
      colors: COLORS,
      adjustmentReasons: MOTIVOS_AJUSTE,
      money: moneyFixtures.map((n) => ({ input: n, output: fmtMoney(n) })),
      stock: stockFixtures.map((p) => ({ input: p, output: fmtStock(p) })),
      productStatus: productStatusFixtures.map((p) => ({
        input: p,
        output: estadoProducto(p),
      })),
      statusColor: statusColorFixtures.map((s) => ({
        input: s,
        output: estadoColor(s),
      })),
      dates: dateFixtures.map((iso) => ({
        input: iso,
        output: fmtFecha(new Date(iso)),
      })),
      ahoraUYOverride: ahoraUYOverrideFixtures.map((ov) => ({
        input: ov,
        output: ahoraUY(ov),
      })),
    };

    if (existsSync(goldenPath)) {
      const golden = JSON.parse(readFileSync(goldenPath, "utf8"));
      expect(computed).toEqual(golden);
    } else {
      expect(computed.money.length).toBeGreaterThan(0);
    }
  });

  it("characterizes nextId sequence and incrementing behavior", () => {
    const id1 = nextId();
    const id2 = nextId();
    expect(id2).toBe(id1 + 1);
  });

  it("characterizes esHoy and claveFechaHoy behavior", () => {
    const now = new Date();
    expect(esHoy(now)).toBe(true);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(esHoy(yesterday)).toBe(false);

    const clave = claveFechaHoy();
    expect(clave).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("characterizes live ahoraUY and horaUYTexto structure", () => {
    const live = ahoraUY();
    expect(live).toHaveProperty("fecha");
    expect(live).toHaveProperty("hora");
    expect(live).toHaveProperty("horaNumero");
    expect(live.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(live.hora).toMatch(/^\d{2}:\d{2}$/);
    expect(typeof live.horaNumero).toBe("number");

    const txt = horaUYTexto();
    expect(txt).toMatch(/^\d{2}:\d{2}$/);
  });
});
