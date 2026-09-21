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

describe("cashShiftRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findShiftByDate selects jornada for date and negocio_id 1", async () => {
    const { findShiftByDate } = await import("./cashShiftRepository");

    const mockSelect = vi.fn().mockReturnThis();
    const mockEqNegocio = vi.fn().mockReturnThis();
    const mockEqFecha = vi.fn().mockReturnThis();
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "caja-2026-09-21" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabase.from>);
    mockSelect.mockReturnValue({ eq: mockEqNegocio });
    mockEqNegocio.mockReturnValue({ eq: mockEqFecha });
    mockEqFecha.mockReturnValue({ maybeSingle: mockMaybeSingle });

    const res = await findShiftByDate("2026-09-21");
    expect(supabase.from).toHaveBeenCalledWith("jornada");
    expect(mockEqNegocio).toHaveBeenCalledWith("negocio_id", 1);
    expect(mockEqFecha).toHaveBeenCalledWith("fecha", "2026-09-21");
    expect(res).toEqual({ id: "caja-2026-09-21" });
  });

  it("closeShift updates jornada with id and negocio_id 1", async () => {
    const { closeShift } = await import("./cashShiftRepository");

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqId = vi.fn().mockReturnThis();
    const mockEqNegocio = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as unknown as ReturnType<typeof supabase.from>);
    mockUpdate.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqNegocio });

    const updatePayload = {
      estado: "CERRADA",
      hora_cierre: "22:00",
      cerrado_automatico: true,
      total: 1000,
      cantidad_ventas: 5,
      updated_at: "2026-09-21T22:00:00.000Z",
    };

    await closeShift("caja-2026-09-21", updatePayload);
    expect(supabase.from).toHaveBeenCalledWith("jornada");
    expect(mockUpdate).toHaveBeenCalledWith(updatePayload);
    expect(mockEqId).toHaveBeenCalledWith("id", "caja-2026-09-21");
    expect(mockEqNegocio).toHaveBeenCalledWith("negocio_id", 1);
  });

  it("createShift inserts jornada and returns created row", async () => {
    const { createShift } = await import("./cashShiftRepository");

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: "caja-2026-09-21" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>);
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });

    const insertPayload = {
      id: "caja-2026-09-21",
      negocio_id: 1,
      fecha: "2026-09-21",
      estado: "ABIERTA",
      hora_apertura: "08:00",
      hora_cierre: null,
      cerrado_automatico: false,
      total: 0,
      cantidad_ventas: 0,
    };

    const res = await createShift(insertPayload);
    expect(supabase.from).toHaveBeenCalledWith("jornada");
    expect(mockInsert).toHaveBeenCalledWith(insertPayload);
    expect(res).toEqual({ id: "caja-2026-09-21" });
  });

  it("reopenShift updates and returns reopened shift", async () => {
    const { reopenShift } = await import("./cashShiftRepository");

    const mockUpdate = vi.fn().mockReturnThis();
    const mockEqId = vi.fn().mockReturnThis();
    const mockEqNegocio = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: "caja-2026-09-21", estado: "ABIERTA" },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as unknown as ReturnType<typeof supabase.from>);
    mockUpdate.mockReturnValue({ eq: mockEqId });
    mockEqId.mockReturnValue({ eq: mockEqNegocio });
    mockEqNegocio.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });

    const reopenPayload = {
      estado: "ABIERTA",
      hora_apertura: "08:00",
      hora_cierre: null,
      cerrado_automatico: false,
      updated_at: "2026-09-21T08:00:00.000Z",
    };

    const res = await reopenShift("caja-2026-09-21", reopenPayload);
    expect(supabase.from).toHaveBeenCalledWith("jornada");
    expect(mockUpdate).toHaveBeenCalledWith(reopenPayload);
    expect(mockEqId).toHaveBeenCalledWith("id", "caja-2026-09-21");
    expect(mockEqNegocio).toHaveBeenCalledWith("negocio_id", 1);
    expect(res.estado).toBe("ABIERTA");
  });
});
