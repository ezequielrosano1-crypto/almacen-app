import { describe, expect, it } from "vitest";
import { filterProducts } from "./productFilters";

describe("filterProducts", () => {
  const productos = [
    { id: 1, nombre: "Yerba", stock: 10, stockMinimo: 5 },
    { id: 2, nombre: "Azúcar", stock: 3, stockMinimo: 5 },
    { id: 3, nombre: "Pan", stock: 0, stockMinimo: 2 },
    { id: 4, nombre: "Yerba Canarias", stock: 8, stockMinimo: 2 },
  ];

  it("returns every product for filter 'all' and empty query", () => {
    expect(filterProducts(productos, "", "all")).toHaveLength(4);
  });

  it("filters by name, case-insensitive substring", () => {
    const result = filterProducts(productos, "yerba", "all");
    expect(result.map((p) => p.id)).toEqual([1, 4]);
  });

  it("filters low-stock products only", () => {
    const result = filterProducts(productos, "", "low");
    expect(result.map((p) => p.id)).toEqual([2]);
  });

  it("filters out-of-stock products only", () => {
    const result = filterProducts(productos, "", "outOfStock");
    expect(result.map((p) => p.id)).toEqual([3]);
  });

  it("combines a name query with a status filter", () => {
    const result = filterProducts(productos, "yerba", "low");
    expect(result).toEqual([]);
  });
});
