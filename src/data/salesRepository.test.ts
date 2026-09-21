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

describe("salesRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSalesWithItems selects exact nested projection", async () => {
    const { listSalesWithItems } = await import("./salesRepository");

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: 77, total: 300 }],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabase.from>);
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });

    const res = await listSalesWithItems();
    expect(supabase.from).toHaveBeenCalledWith("ventas");
    expect(mockEq).toHaveBeenCalledWith("negocio_id", 1);
    expect(mockOrder).toHaveBeenCalledWith("fecha", { ascending: false });
    expect(res).toHaveLength(1);
  });

  it("listSaleItems selects items for a specific saleId", async () => {
    const { listSaleItems } = await import("./salesRepository");

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({
      data: [{ id: 1, venta_id: 77 }],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabase.from>);
    mockSelect.mockReturnValue({ eq: mockEq });

    const res = await listSaleItems(77);
    expect(supabase.from).toHaveBeenCalledWith("venta_items");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("venta_id", 77);
    expect(res).toHaveLength(1);
  });
});

describe("salesRepository.registerSale", () => {
  it("calls the registrar_venta RPC with prefixed params and returns the sale", async () => {
    const { registerSale } = await import("./salesRepository");
    const rpc = vi.fn().mockResolvedValue({ data: { id: 9 }, error: null });
    (supabase as unknown as { rpc: typeof rpc }).rpc = rpc;

    const items = [
      {
        producto_id: 1,
        nombre: "Yerba",
        cantidad: 1,
        unidad: "unidad",
        precio_unitario: 190,
        subtotal: 190,
      },
    ];
    const result = await registerSale({
      negocio_id: 1,
      jornada_id: null,
      pago: "Efectivo",
      total: 190,
      items,
    });

    expect(rpc).toHaveBeenCalledWith("registrar_venta", {
      p_negocio_id: 1,
      p_jornada_id: null,
      p_pago: "Efectivo",
      p_total: 190,
      p_items: items,
    });
    expect(result).toEqual({ id: 9 });
  });

  it("throws the Supabase error", async () => {
    const { registerSale } = await import("./salesRepository");
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("boom") });
    (supabase as unknown as { rpc: typeof rpc }).rpc = rpc;

    await expect(
      registerSale({ negocio_id: 1, jornada_id: null, pago: "Efectivo", total: 1, items: [] }),
    ).rejects.toThrow("boom");
  });
});
