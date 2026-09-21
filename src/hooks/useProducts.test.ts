import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import {
  applyProductSave,
  applyStockUpdate,
  type ProductItem,
  saveProductToRepository,
  updateStockInRepository,
} from "./useProducts";

describe("useProducts pure functions and repository interactions", () => {
  const initial: ProductItem[] = [
    {
      id: 1,
      nombre: "Yerba 1kg",
      precio: 180,
      unidad: "unidad",
      stock: 10,
      stockMinimo: 3,
      codigoBarras: "773000000001",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applyStockUpdate updates stock of matching product", () => {
    const updated = applyStockUpdate(initial, 1, 15);
    expect(updated[0].stock).toBe(15);
    expect(updated[0].nombre).toBe("Yerba 1kg");
  });

  it("applyProductSave inserts a new product", () => {
    const nuevo: ProductItem = {
      id: 2,
      nombre: "Arroz 1kg",
      precio: 60,
      unidad: "unidad",
      stock: 5,
      stockMinimo: 2,
      codigoBarras: null,
    };
    const result = applyProductSave(initial, nuevo);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe(2);
  });

  it("applyProductSave updates existing product when matching id", () => {
    const updated: ProductItem = {
      id: 1,
      nombre: "Yerba 1kg Especial",
      precio: 200,
      unidad: "unidad",
      stock: 8,
      stockMinimo: 3,
    };
    const result = applyProductSave(initial, updated);
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe("Yerba 1kg Especial");
    expect(result[0].precio).toBe(200);
  });

  it("updateStockInRepository calls updateProductStock and returns true on success", async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const ok = await updateStockInRepository(1, 12, { updateProductStock: mockUpdate });

    expect(ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(1, 12);
  });

  it("updateStockInRepository handles error gracefully and returns false", async () => {
    const mockUpdate = vi.fn().mockRejectedValue(new Error("Database error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const ok = await updateStockInRepository(1, 12, { updateProductStock: mockUpdate });

    expect(ok).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("saveProductToRepository formats payload and calls upsertProduct", async () => {
    const mockUpsert = vi.fn().mockResolvedValue(undefined);
    const nuevo: ProductItem = {
      id: 2,
      nombre: "Arroz",
      precio: 50,
      unidad: "kg",
      stock: 20,
      stockMinimo: 5,
      codigoBarras: "123456",
    };

    const ok = await saveProductToRepository(nuevo, { upsertProduct: mockUpsert });

    expect(ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith({
      id: 2,
      negocio_id: 1,
      nombre: "Arroz",
      precio: 50,
      unidad: "kg",
      stock: 20,
      stock_minimo: 5,
      codigo_barras: "123456",
    });
  });

  it("saveProductToRepository handles failure gracefully", async () => {
    const mockUpsert = vi.fn().mockRejectedValue(new Error("Supabase error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const nuevo: ProductItem = {
      id: 3,
      nombre: "Fideos",
      precio: 40,
      stock: 10,
    };

    const ok = await saveProductToRepository(nuevo, { upsertProduct: mockUpsert });

    expect(ok).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
