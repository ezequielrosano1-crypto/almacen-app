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

  it("createSale inserts sale and returns single result", async () => {
    const { createSale } = await import("./salesRepository");

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 77 },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });

    const payload = {
      negocio_id: 1,
      jornada_id: "caja-1",
      fecha: "2026-09-21T10:00:00.000Z",
      total: 500,
      pago: "Efectivo",
    };

    const res = await createSale(payload);
    expect(supabase.from).toHaveBeenCalledWith("ventas");
    expect(mockInsert).toHaveBeenCalledWith(payload);
    expect(res).toEqual({ id: 77 });
  });

  it("insertSaleItems inserts rows into 'venta_items'", async () => {
    const { insertSaleItems } = await import("./salesRepository");

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    const items = [
      {
        venta_id: 77,
        producto_id: 1,
        nombre: "Yerba",
        cantidad: 2,
        unidad: "unidad",
        precio_unitario: 150,
        subtotal: 300,
      },
    ];

    await insertSaleItems(items);
    expect(supabase.from).toHaveBeenCalledWith("venta_items");
    expect(mockInsert).toHaveBeenCalledWith(items);
  });

  it("deleteSale deletes sale matching id and negocio_id 1", async () => {
    const { deleteSale } = await import("./salesRepository");

    const mockDelete = vi.fn().mockReturnThis();
    const mockEqId = vi.fn().mockReturnThis();
    const mockEqNegocio = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
    } as unknown as ReturnType<typeof supabase.from>);
    mockDelete.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqNegocio });

    await deleteSale(77);
    expect(supabase.from).toHaveBeenCalledWith("ventas");
    expect(mockEqId).toHaveBeenCalledWith("id", 77);
    expect(mockEqNegocio).toHaveBeenCalledWith("negocio_id", 1);
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
