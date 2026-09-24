import { describe, expect, it } from "vitest";
import golden from "../../test/golden/metrics.json";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  getSalesDelta,
  getTodayCashTotal,
  getTodayDebitTotal,
  getTodayProductsSold,
  getTodaySales,
  getTodayTotal,
  getTopProducts,
  getWeekSales,
} from "./metrics";

describe("metrics calculations", () => {
  const productos = [
    {
      id: 1,
      nombre: "Yerba",
      stock: 10,
      stockMinimo: 5,
      precio: 150,
      unidad: "un.",
    },
    {
      id: 2,
      nombre: "Azúcar",
      stock: 3,
      stockMinimo: 5,
      precio: 60,
      unidad: "un.",
    },
    {
      id: 3,
      nombre: "Pan",
      stock: 0,
      stockMinimo: 2,
      precio: 80,
      unidad: "kg",
    },
    {
      id: 4,
      nombre: "Leche",
      stock: -1,
      stockMinimo: 5,
      precio: 45,
      unidad: "un.",
    },
  ];

  const refDate = new Date("2026-09-21T15:00:00.000Z");
  const isTodayFn = (d: Date | string) => new Date(d).toDateString() === refDate.toDateString();

  const movimientos = [
    {
      id: 1,
      tipo: "venta" as const,
      fecha: new Date("2026-09-21T10:00:00.000Z"),
      total: 300,
      pago: "Efectivo" as const,
      items: [{ cantidad: 2 }, { cantidad: 1 }],
    },
    {
      id: 2,
      tipo: "venta" as const,
      fecha: new Date("2026-09-21T14:00:00.000Z"),
      total: 120,
      pago: "Débito" as const,
      items: [{ cantidad: 2 }],
    },
    {
      id: 3,
      tipo: "venta" as const,
      fecha: new Date("2026-09-20T14:00:00.000Z"),
      total: 500,
      pago: "Efectivo" as const,
      items: [{ cantidad: 5 }],
    },
    {
      id: 4,
      tipo: "entrada" as const,
      fecha: new Date("2026-09-21T09:00:00.000Z"),
      cantidad: 10,
    },
  ];

  it("calculates today sales and breakdowns matching golden metrics", () => {
    const todaySales = getTodaySales(movimientos, isTodayFn);
    expect(todaySales.length).toBe(2);

    expect(getTodayTotal(todaySales)).toBe(golden.totalHoy);
    expect(getTodayCashTotal(todaySales)).toBe(golden.efectivoHoy);
    expect(getTodayDebitTotal(todaySales)).toBe(golden.debitoHoy);
    expect(getTodayProductsSold(todaySales)).toBe(golden.productosVendidosHoy);
  });

  it("calculates low and out of stock products count", () => {
    const low = getLowStockProducts(productos);
    const out = getOutOfStockProducts(productos);

    expect(low.length).toBe(golden.productosBajoCount);
    expect(out.length).toBe(golden.productosAgotadosCount);
  });

  it("calculates weekly sales buckets", () => {
    const week = getWeekSales(movimientos, refDate);
    expect(week.length).toBe(7);
    expect(week.map((w) => ({ fecha: w.date, dia: w.day, total: w.total }))).toEqual(
      golden.ventasSemana,
    );
  });

  it("calculates the % delta of today's sales vs yesterday", () => {
    // today (2026-09-21) totals 420, yesterday (2026-09-20) totals 500 -> -16%
    const delta = getSalesDelta(movimientos, refDate);
    expect(delta).toEqual({ percent: -16, trend: "down" });
  });

  it("returns null when yesterday has no sales (percent would be undefined)", () => {
    const soloHoy = movimientos.filter((m) => m.id !== 3);
    expect(getSalesDelta(soloHoy, refDate)).toBeNull();
  });

  it("ranks products sold over the last 7 days by quantity", () => {
    const ventasConItems = [
      {
        id: 1,
        tipo: "venta" as const,
        fecha: new Date("2026-09-21T10:00:00.000Z"),
        items: [
          { productId: 1, name: "Yerba", cantidad: 2 },
          { productId: 2, name: "Azúcar", cantidad: 1 },
        ],
      },
      {
        id: 2,
        tipo: "venta" as const,
        fecha: new Date("2026-09-20T14:00:00.000Z"),
        items: [{ productId: 1, name: "Yerba", cantidad: 5 }],
      },
      {
        id: 3,
        tipo: "entrada" as const,
        fecha: new Date("2026-09-21T09:00:00.000Z"),
        cantidad: 10,
      },
      {
        id: 4,
        tipo: "venta" as const,
        fecha: new Date("2026-09-01T09:00:00.000Z"),
        items: [{ productId: 3, name: "Pan", cantidad: 99 }],
      },
    ];

    const top = getTopProducts(ventasConItems, 2, refDate);
    expect(top).toEqual([
      { productId: 1, name: "Yerba", quantity: 7 },
      { productId: 2, name: "Azúcar", quantity: 1 },
    ]);
  });

  it("returns an empty ranking when there are no sales in range", () => {
    expect(getTopProducts([], 5, refDate)).toEqual([]);
  });
});
