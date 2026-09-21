import { describe, expect, it } from "vitest";
import golden from "../../test/golden/helpers.json";
import { formatStock, getProductStatus, getStatusColor } from "./stock";

describe("formatStock", () => {
  it("formats stock quantity with unit matching golden outputs", () => {
    for (const { input, output } of golden.stock) {
      expect(
        formatStock({
          stock: input.stock,
          unit: input.unidad as "unidad" | "kg",
        }),
      ).toBe(output);
    }
  });
});

describe("getProductStatus", () => {
  it("calculates product status matching golden outputs", () => {
    for (const { input, output } of golden.productStatus) {
      expect(
        getProductStatus({
          stock: input.stock,
          minimumStock: input.stockMinimo,
        }),
      ).toBe(output);
    }
  });
});

describe("getStatusColor", () => {
  it("maps status to color matching golden outputs", () => {
    for (const { input, output } of golden.statusColor) {
      expect(getStatusColor(input)).toBe(output);
    }
  });
});
