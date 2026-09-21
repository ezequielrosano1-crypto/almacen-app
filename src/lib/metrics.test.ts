import { describe, expect, it } from "vitest";
import golden from "../../test/golden/metrics.json";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  getTodayCashTotal,
  getTodayDebitTotal,
  getTodayProductsSold,
  getTodaySales,
  getTodayTotal,
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
});
