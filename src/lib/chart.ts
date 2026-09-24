export interface ChartPoint {
  x: number;
  y: number;
}

export interface LineChartGeometry {
  points: ChartPoint[];
  linePath: string;
  areaPath: string;
}

// Maps a series of values to SVG coordinates for a simple line+area chart
// (no chart library): higher values sit closer to y=0, x spans evenly across
// `width`. Used by HomeView's "Evolución de ventas" widget.
export function buildLineChartGeometry(
  values: number[],
  width: number,
  height: number,
): LineChartGeometry {
  if (values.length === 0) return { points: [], linePath: "", areaPath: "" };

  if (values.length === 1) {
    return {
      points: [{ x: width / 2, y: height / 2 }],
      linePath: `M${width / 2},${height / 2}`,
      areaPath: "",
    };
  }

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => ({
    x: Number((i * stepX).toFixed(2)),
    y: Number((height - ((v - min) / range) * height).toFixed(2)),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L${lastPoint.x},${height} L${firstPoint.x},${height} Z`;

  return { points, linePath, areaPath };
}
