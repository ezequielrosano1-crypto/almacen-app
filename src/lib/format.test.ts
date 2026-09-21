import { describe, expect, it } from "vitest";
import golden from "../../test/golden/helpers.json";
import { formatDate, formatMoney } from "./format";

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
