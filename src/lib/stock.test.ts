import { describe, expect, it } from "vitest";
import golden from "../../test/golden/helpers.json";
import { COLORS } from "./constants";
import { formatStock, getProductStatus, getStatusColor, getStatusTone } from "./stock";

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
  // Golden fixtures cover status inputs (normal/bajo/agotado/desconocido); the
  // expected colors follow the current STOCKIA brand tokens, not the frozen
  // legacy golden `output` values (those belong to the old green palette).
  it("maps status to the current brand color tokens", () => {
    for (const { input } of golden.statusColor) {
      const expected =
        input === "agotado" ? COLORS.agotado : input === "bajo" ? COLORS.bajo : COLORS.normal;
      expect(getStatusColor(input)).toBe(expected);
    }
  });
});

describe("getStatusTone", () => {
  it("maps product status to a StatusBadge tone", () => {
    expect(getStatusTone("normal")).toBe("success");
    expect(getStatusTone("bajo")).toBe("warning");
    expect(getStatusTone("agotado")).toBe("danger");
    expect(getStatusTone("desconocido")).toBe("neutral");
  });
});
