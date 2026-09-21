import { describe, expect, it } from "vitest";
import { isScenarioPassing } from "./cashShiftScenarios";

describe("isScenarioPassing", () => {
  it("passes when the obtained state is the expected one", () => {
    expect(isScenarioPassing("ABIERTA", "ABIERTA")).toBe(true);
    expect(isScenarioPassing("CERRADA", "CERRADA")).toBe(true);
  });

  it("fails when the state differs", () => {
    expect(isScenarioPassing("ABIERTA", "CERRADA")).toBe(false);
    expect(isScenarioPassing("CERRADA", "ABIERTA")).toBe(false);
  });

  it("accepts SIN DATOS where CERRADA is expected (outside opening hours no jornada is created)", () => {
    expect(isScenarioPassing("CERRADA", "SIN DATOS")).toBe(true);
  });

  it("does not accept SIN DATOS where ABIERTA is expected", () => {
    expect(isScenarioPassing("ABIERTA", "SIN DATOS")).toBe(false);
  });
});
