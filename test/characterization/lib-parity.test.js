import { describe, expect, it } from "vitest";
import { formatDate, formatMoney } from "../../src/lib/format";
import { formatStock, getProductStatus, getStatusColor } from "../../src/lib/stock";
import golden from "../golden/helpers.json";
import { estadoColor, estadoProducto, fmtFecha, fmtMoney, fmtStock } from "../legacy/helpers.js";

describe("lib parity: legacy vs new symbols", () => {
  it("formatMoney produces identical outputs to legacy fmtMoney", () => {
    for (const { input, output } of golden.money) {
      expect(formatMoney(input)).toBe(fmtMoney(input));
      expect(formatMoney(input)).toBe(output);
    }
  });

  it("formatStock produces identical outputs to legacy fmtStock", () => {
    for (const { input, output } of golden.stock) {
      expect(
        formatStock({
          stock: input.stock,
          unit: input.unidad,
        }),
      ).toBe(fmtStock(input));
      expect(
        formatStock({
          stock: input.stock,
          unit: input.unidad,
        }),
      ).toBe(output);
    }
  });

  it("getProductStatus produces identical outputs to legacy estadoProducto", () => {
    for (const { input, output } of golden.productStatus) {
      expect(
        getProductStatus({
          stock: input.stock,
          minimumStock: input.stockMinimo,
        }),
      ).toBe(estadoProducto(input));
      expect(
        getProductStatus({
          stock: input.stock,
          minimumStock: input.stockMinimo,
        }),
      ).toBe(output);
    }
  });

  it("getStatusColor produces identical outputs to legacy estadoColor", () => {
    for (const { input, output } of golden.statusColor) {
      expect(getStatusColor(input)).toBe(estadoColor(input));
      expect(getStatusColor(input)).toBe(output);
    }
  });

  it("formatDate produces identical outputs to legacy fmtFecha", () => {
    for (const { input, output } of golden.dates) {
      const d = new Date(input);
      expect(formatDate(d)).toBe(fmtFecha(d));
      expect(formatDate(d)).toBe(output);
    }
  });
});
