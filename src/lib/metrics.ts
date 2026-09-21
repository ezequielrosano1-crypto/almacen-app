import type { WeekSalesBucket } from "../types/domain";
import { isToday as isTodayDefault, uruguayDateKey, uruguayWeekdayLabel } from "./dates";
import { getProductStatus } from "./stock";

export interface MetricSaleItem {
  quantity?: number;
  cantidad?: number;
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
