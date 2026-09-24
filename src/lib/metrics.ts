import type { ProductId, WeekSalesBucket } from "../types/domain";
import { isToday as isTodayDefault, uruguayDateKey, uruguayWeekdayLabel } from "./dates";
import { getProductStatus } from "./stock";

export interface MetricSaleItem {
  quantity?: number;
  cantidad?: number;
  productId?: ProductId;
  productoId?: ProductId;
  name?: string;
  nombre?: string;
}

export interface MetricMovement {
  type?: string;
  tipo?: string;
  date?: Date | string;
  fecha?: Date | string;
  total?: number;
  paymentMethod?: string;
  pago?: string;
  items?: MetricSaleItem[];
}

export function getTodaySales<T extends MetricMovement>(
  movements: T[],
  isTodayFn: (d: Date | string) => boolean = isTodayDefault,
): T[] {
  return movements.filter((m) => {
    const isSale = (m.type || m.tipo) === "venta";
    const date = m.date || m.fecha;
    return isSale && date && isTodayFn(date);
  });
}

export function getTodayTotal(todaySales: MetricMovement[]): number {
  return todaySales.reduce((acc, v) => acc + Number(v.total || 0), 0);
}

export function getTodayCashTotal(todaySales: MetricMovement[]): number {
  return todaySales
    .filter((v) => (v.paymentMethod || v.pago) === "Efectivo")
    .reduce((a, v) => a + Number(v.total || 0), 0);
}

export function getTodayDebitTotal(todaySales: MetricMovement[]): number {
  return todaySales
    .filter((v) => (v.paymentMethod || v.pago) === "Débito")
    .reduce((a, v) => a + Number(v.total || 0), 0);
}

export function getTodayProductsSold(todaySales: MetricMovement[]): number {
  return todaySales.reduce((acc, v) => {
    const items = v.items || [];
    return (
      acc +
      items.reduce(
        (a: number, it: MetricSaleItem) => a + Number(it.quantity ?? it.cantidad ?? 0),
        0,
      )
    );
  }, 0);
}

export function getLowStockProducts<
  T extends { stock: number; minimumStock?: number; stockMinimo?: number },
>(products: T[]): T[] {
  return products.filter((p) => {
    const min = p.minimumStock ?? p.stockMinimo ?? 0;
    return getProductStatus({ stock: p.stock, minimumStock: min }) === "bajo";
  });
}

export function getOutOfStockProducts<
  T extends { stock: number; minimumStock?: number; stockMinimo?: number },
>(products: T[]): T[] {
  return products.filter((p) => {
    const min = p.minimumStock ?? p.stockMinimo ?? 0;
    return getProductStatus({ stock: p.stock, minimumStock: min }) === "agotado";
  });
}

export interface SalesDelta {
  percent: number;
  trend: "up" | "down";
}

// % change of today's sales total vs yesterday's, for the Inicio KPI delta.
// Returns null when yesterday had no sales (a "vs ayer" % would be
// undefined/infinite) so the caller can fall back to a neutral hint instead.
export function getSalesDelta(
  movements: MetricMovement[],
  referenceDate: Date = new Date(),
): SalesDelta | null {
  const totalForDay = (dateKey: string): number =>
    movements
      .filter((m) => {
        const isSale = (m.type || m.tipo) === "venta";
        const rawDate = m.date || m.fecha;
        if (!isSale || !rawDate) return false;
        return uruguayDateKey(new Date(rawDate)) === dateKey;
      })
      .reduce((acc, m) => acc + Number(m.total || 0), 0);

  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayTotal = totalForDay(uruguayDateKey(referenceDate));
  const yesterdayTotal = totalForDay(uruguayDateKey(yesterday));

  if (yesterdayTotal === 0) return null;

  const percent = Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100);
  return { percent, trend: percent >= 0 ? "up" : "down" };
}

export interface TopProductItem {
  productId?: ProductId;
  name: string;
  quantity: number;
}

// Ranks products by units sold across the last 7 days (today included), for
// the "Productos más vendidos" card. Aggregates SaleMovement.items by
// productId (falls back to name when productId is missing).
export function getTopProducts(
  movements: MetricMovement[],
  limit: number,
  referenceDate: Date = new Date(),
): TopProductItem[] {
  const since = new Date(referenceDate);
  since.setDate(since.getDate() - 6);
  const sinceKey = uruguayDateKey(since);
  const refKey = uruguayDateKey(referenceDate);

  const totals = new Map<string, TopProductItem>();

  for (const m of movements) {
    const isSale = (m.type || m.tipo) === "venta";
    const rawDate = m.date || m.fecha;
    if (!isSale || !rawDate) continue;
    const dateKey = uruguayDateKey(new Date(rawDate));
    if (dateKey < sinceKey || dateKey > refKey) continue;

    for (const item of m.items || []) {
      const productId = item.productId ?? item.productoId;
      const name = item.name ?? item.nombre ?? "Producto";
      const key = productId != null ? String(productId) : `name:${name}`;
      const quantity = Number(item.quantity ?? item.cantidad ?? 0);
      const existing = totals.get(key);
      if (existing) existing.quantity += quantity;
      else totals.set(key, { productId, name, quantity });
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export function getWeekSales(
  movements: MetricMovement[],
  referenceDate: Date = new Date(),
): WeekSalesBucket[] {
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(referenceDate);
    fecha.setDate(fecha.getDate() - (6 - i));

    const fechaUY = uruguayDateKey(fecha);

    const total = movements
      .filter((m) => {
        const isSale = (m.type || m.tipo) === "venta";
        if (!isSale) return false;

        const rawDate = m.date || m.fecha;
        if (!rawDate) return false;
        const fechaVenta = uruguayDateKey(new Date(rawDate));
        return fechaVenta === fechaUY;
      })
      .reduce((acc, m) => acc + Number(m.total || 0), 0);

    const dia = uruguayWeekdayLabel(fecha);

    return {
      date: fechaUY,
      day: dia,
      total,
    };
  });
}
