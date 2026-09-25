import { describe, expect, it } from "vitest";
import golden from "../../test/golden/helpers.json";
import { formatDate, formatMoney, getInitials } from "./format";

describe("formatMoney", () => {
  it("formats numbers as UY pesos matching golden outputs", () => {
    for (const { input, output } of golden.money) {
      expect(formatMoney(input)).toBe(output);
    }
  });
});

describe("formatDate", () => {
  it("formats Date instances in America/Montevideo timezone matching golden outputs", () => {
    for (const { input, output } of golden.dates) {
      expect(formatDate(new Date(input))).toBe(output);
    }
  });
});

describe("getInitials", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(getInitials("MiniMarket La Esquina")).toBe("ML");
    expect(getInitials("Almacén")).toBe("AL");
  });

  it("falls back to a single letter for a one-character name", () => {
    expect(getInitials("A")).toBe("A");
  });

  it("returns a neutral placeholder for an empty name", () => {
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ")).toBe("?");
  });
});
