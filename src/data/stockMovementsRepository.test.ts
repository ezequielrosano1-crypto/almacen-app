import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StockMovementRow } from "../types/db";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

const entradaRow: StockMovementRow = {
  id: 41,
  negocio_id: 1,
  producto_id: 12,
  producto_nombre: "Yerba",
  jornada_id: null,
  fecha: "2026-09-21T10:00:00+00:00",
  tipo: "entrada",
  cantidad: 5,
  unidad: "unidad",
  diferencia: 5,
  motivo: "Entrada de stock",
};

describe("stockMovementsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registerStockMovement calls the RPC with prefixed params and returns movement + new stock", async () => {
    const { registerStockMovement } = await import("./stockMovementsRepository");
    const rpc = vi.fn().mockResolvedValue({
      data: { movimiento: entradaRow, stock: 15 },
      error: null,
    });
    (supabase as unknown as { rpc: typeof rpc }).rpc = rpc;

    const result = await registerStockMovement({ producto_id: 12, tipo: "entrada", cantidad: 5 });

    expect(rpc).toHaveBeenCalledWith("registrar_movimiento_stock", {
      p_negocio_id: 1,
      p_producto_id: 12,
      p_tipo: "entrada",
      p_cantidad: 5,
      p_motivo: null,
    });
    expect(result).toEqual({ movimiento: entradaRow, stock: 15 });
  });

  it("registerStockMovement forwards the adjustment reason", async () => {
    const { registerStockMovement } = await import("./stockMovementsRepository");
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: { movimiento: entradaRow, stock: 3 }, error: null });
    (supabase as unknown as { rpc: typeof rpc }).rpc = rpc;

    await registerStockMovement({ producto_id: 12, tipo: "ajuste", cantidad: 3, motivo: "Rotura" });

    expect(rpc).toHaveBeenCalledWith(
      "registrar_movimiento_stock",
      expect.objectContaining({ p_tipo: "ajuste", p_cantidad: 3, p_motivo: "Rotura" }),
    );
  });

  it("registerStockMovement throws the Supabase error", async () => {
    const { registerStockMovement } = await import("./stockMovementsRepository");
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("boom") });
    (supabase as unknown as { rpc: typeof rpc }).rpc = rpc;

    await expect(
      registerStockMovement({ producto_id: 1, tipo: "entrada", cantidad: 1 }),
    ).rejects.toThrow("boom");
  });

  it("listStockMovements selects entrada/ajuste of negocio 1, newest first (sales live in ventas)", async () => {
    const { listStockMovements } = await import("./stockMovementsRepository");
    const order = vi.fn().mockResolvedValue({ data: [entradaRow], error: null });
    const inTipo = vi.fn().mockReturnValue({ order });
    const eq = vi.fn().mockReturnValue({ in: inTipo });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(supabase.from).mockReturnValue({ select } as unknown as ReturnType<
      typeof supabase.from
    >);

    const rows = await listStockMovements();

    expect(supabase.from).toHaveBeenCalledWith("movimientos_stock");
    expect(eq).toHaveBeenCalledWith("negocio_id", 1);
    expect(inTipo).toHaveBeenCalledWith("tipo", ["entrada", "ajuste"]);
    expect(order).toHaveBeenCalledWith("fecha", { ascending: false });
    expect(rows).toEqual([entradaRow]);
  });
});

describe("toMovementRecord", () => {
  it("maps a DB row to the record the UI renders, including the product name", async () => {
    const { toMovementRecord } = await import("./mappers");

    const record = toMovementRecord(entradaRow);

    expect(record).toMatchObject({
      id: 41,
      tipo: "entrada",
      type: "entrada",
      productoId: 12,
      producto: "Yerba",
      productName: "Yerba",
      cantidad: 5,
      unidad: "unidad",
      diferencia: 5,
      motivo: "Entrada de stock",
    });
    expect(record.fecha).toEqual(new Date("2026-09-21T10:00:00+00:00"));
  });

  it("tolerates legacy rows without name or numeric fields", async () => {
    const { toMovementRecord } = await import("./mappers");

    const record = toMovementRecord({
      ...entradaRow,
      producto_nombre: null,
      cantidad: null,
      diferencia: null,
      motivo: null,
    });

    expect(record).toMatchObject({ producto: "", cantidad: 0, diferencia: 0, motivo: "" });
  });
});
