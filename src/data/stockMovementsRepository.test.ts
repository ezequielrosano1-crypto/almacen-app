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

describe("stockMovementsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("insertStockEntry inserts into 'movimientos_stock'", async () => {
    const { insertStockEntry } = await import("./stockMovementsRepository");

    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);

    const payload = {
      negocio_id: 1,
      producto_id: 12,
      jornada_id: "caja-1",
      fecha: "2026-09-21T10:00:00.000Z",
      tipo: "entrada",
      cantidad: 5,
      unidad: "unidad",
      diferencia: 5,
      motivo: "Reposición",
    };

    await insertStockEntry(payload);
    expect(supabase.from).toHaveBeenCalledWith("movimientos_stock");
    expect(mockInsert).toHaveBeenCalledWith(payload);
  });
});
