import { describe, expect, it, vi } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { type SubmitSaleDeps, type SubmitSaleInput, submitSale } from "./submitSale";

describe("submitSale", () => {
  const mockInput: SubmitSaleInput = {
    total: 350,
    pago: "Efectivo",
    items: [
      {
        cantidad: 1,
        subtotal: 190,
        producto: { id: 1, nombre: "Yerba", unidad: "unidad", precio: 190, stock: 10 },
      },
      {
        cantidad: 2,
        subtotal: 160,
        producto: { id: 2, nombre: "Manzanas", unidad: "kg", precio: 80, stock: 5 },
      },
    ],
  };

  const savedSale = {
    id: 123,
    negocio_id: 1,
    jornada_id: null,
    fecha: "2026-09-21T10:00:00.000Z",
    total: 350,
    pago: "Efectivo",
  };

  it("registers the whole sale with ONE call, mapping cart items to the RPC payload", async () => {
    const deps: SubmitSaleDeps = { registerSale: vi.fn(async () => savedSale) };

    const result = await submitSale(mockInput, deps);

    expect(result.id).toBe(123);
    expect(deps.registerSale).toHaveBeenCalledTimes(1);
    expect(deps.registerSale).toHaveBeenCalledWith({
      negocio_id: 1,
      jornada_id: null,
      pago: "Efectivo",
      total: 350,
      items: [
        {
          producto_id: 1,
          nombre: "Yerba",
          cantidad: 1,
          unidad: "unidad",
          precio_unitario: 190,
          subtotal: 190,
        },
        {
          producto_id: 2,
          nombre: "Manzanas",
          cantidad: 2,
          unidad: "kg",
          precio_unitario: 80,
          subtotal: 160,
        },
      ],
    });
  });

  it("coerces numeric strings coming from the cart UI", async () => {
    const deps: SubmitSaleDeps = { registerSale: vi.fn(async () => savedSale) };

    await submitSale(
      {
        total: "350" as unknown as number,
        pago: "Débito",
        items: [
          {
            cantidad: "2" as unknown as number,
            subtotal: "160" as unknown as number,
            producto: {
              id: 2,
              nombre: "Manzanas",
              unidad: "kg",
              precio: "80" as unknown as number,
              stock: 5,
            },
          },
        ],
      },
      deps,
    );

    const payload = vi.mocked(deps.registerSale).mock.calls[0]?.[0];
    expect(payload?.total).toBe(350);
    expect(payload?.items[0]).toMatchObject({ cantidad: 2, precio_unitario: 80, subtotal: 160 });
  });

  it("propagates the error and does not swallow it (the database rolls the sale back atomically)", async () => {
    const deps: SubmitSaleDeps = {
      registerSale: vi.fn(async () => {
        throw new Error("product 2 not found");
      }),
    };

    await expect(submitSale(mockInput, deps)).rejects.toThrow("product 2 not found");
    expect(deps.registerSale).toHaveBeenCalledTimes(1);
  });
});
