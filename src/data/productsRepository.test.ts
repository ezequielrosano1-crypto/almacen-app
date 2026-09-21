import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => {
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
    },
  };
});

describe("productsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listProducts calls 'productos' with negocio_id 1 filter", async () => {
    const { listProducts } = await import("./productsRepository");

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({
      data: [{ id: 1, nombre: "Test", negocio_id: 1 }],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabase.from>);
    mockSelect.mockReturnValue({ eq: mockEq });

    const result = await listProducts();
    expect(supabase.from).toHaveBeenCalledWith("productos");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("negocio_id", 1);
    expect(result).toHaveLength(1);
  });

  it("updateProductStock updates stock with negocio_id 1 filter", async () => {
    const { updateProductStock } = await import("./productsRepository");

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqId = vi.fn().mockReturnThis();
    const mockEqNegocio = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as unknown as ReturnType<typeof supabase.from>);
    mockUpdate.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqNegocio });

    await updateProductStock(10, 50);
    expect(supabase.from).toHaveBeenCalledWith("productos");
    expect(mockUpdate).toHaveBeenCalledWith({ stock: 50 });
    expect(mockEqId).toHaveBeenCalledWith("id", 10);
    expect(mockEqNegocio).toHaveBeenCalledWith("negocio_id", 1);
  });

  it("upsertProduct upserts product row with onConflict 'id'", async () => {
    const { upsertProduct } = await import("./productsRepository");

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: mockUpsert,
    } as unknown as ReturnType<typeof supabase.from>);

    const payload = {
      id: 5,
      negocio_id: 1,
      nombre: "Prod",
      precio: 100,
      unidad: "unidad",
      stock: 10,
      stock_minimo: 2,
      codigo_barras: null,
    };

    await upsertProduct(payload);
    expect(supabase.from).toHaveBeenCalledWith("productos");
    expect(mockUpsert).toHaveBeenCalledWith(payload, { onConflict: "id" });
  });
});
