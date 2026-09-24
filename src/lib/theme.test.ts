import { describe, expect, it } from "vitest";
import { colors } from "./theme";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

describe("theme colors", () => {
  it("exposes the STOCKIA brand tokens", () => {
    expect(colors.carbon).toBe("#0F172A");
    expect(colors.brand).toBe("#0066FF");
    expect(colors.canvas).toBe("#F5F7FB");
    expect(colors.ink).toBe("#1F2937");
  });

  it("only contains valid 6-digit hex values", () => {
    for (const [key, value] of Object.entries(colors)) {
      expect(value, `colors.${key} should be a valid hex color`).toMatch(HEX_RE);
    }
  });
});
