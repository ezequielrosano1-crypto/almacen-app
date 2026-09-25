import { describe, expect, it } from "vitest";
import { buildLineChartGeometry } from "./chart";

describe("buildLineChartGeometry", () => {
  it("returns empty geometry for no values", () => {
    expect(buildLineChartGeometry([], 100, 50)).toEqual({
      points: [],
      linePath: "",
      areaPath: "",
    });
  });

  it("maps values to points spanning the given width, higher values closer to y=0", () => {
    const geometry = buildLineChartGeometry([0, 10, 20], 100, 50);
    expect(geometry.points).toHaveLength(3);
    expect(geometry.points[0]).toEqual({ x: 0, y: 50 });
    expect(geometry.points[2]).toEqual({ x: 100, y: 0 });
    // middle value is between the two y extremes
    expect(geometry.points[1].y).toBeGreaterThan(0);
    expect(geometry.points[1].y).toBeLessThan(50);
  });

  it("builds an SVG line path starting with M and an area path closed at the baseline", () => {
    const geometry = buildLineChartGeometry([5, 15], 100, 50);
    expect(geometry.linePath.startsWith("M")).toBe(true);
    expect(geometry.areaPath.endsWith("Z")).toBe(true);
    expect(geometry.areaPath).toContain(`,${50}`);
  });

  it("centers a single value horizontally without dividing by zero", () => {
    const geometry = buildLineChartGeometry([7], 100, 50);
    expect(geometry.points).toEqual([{ x: 50, y: 25 }]);
  });
});
