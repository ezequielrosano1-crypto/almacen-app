import type { RegisterSaleInput, SaleRow } from "../types/db";
import { registerSale } from "./salesRepository";

export interface SubmitSaleCartItem {
  cantidad: number;
  subtotal: number;
  producto: {
    id: number | string;
    nombre: string;
    unidad: string;
    precio: number;
    stock: number;
  };
}

export interface SubmitSaleInput {
  total: number;
  pago: string;
  items: SubmitSaleCartItem[];
}

export interface SubmitSaleDeps {
  registerSale: (input: RegisterSaleInput) => Promise<SaleRow>;
}

const defaultDeps: SubmitSaleDeps = { registerSale };

// One call, one transaction: the sale, its items and the stock decrement either
// all happen or none does. Stock is decremented in SQL, not computed from the
// client's (possibly stale) copy of the product.
export async function submitSale(
  input: SubmitSaleInput,
  deps: SubmitSaleDeps = defaultDeps,
): Promise<SaleRow> {
  return await deps.registerSale({
    negocio_id: 1,
    jornada_id: null,
    pago: input.pago,
    total: Number(input.total),
    items: input.items.map((it) => ({
      producto_id: it.producto.id,
      nombre: it.producto.nombre,
      cantidad: Number(it.cantidad),
      unidad: it.producto.unidad,
      precio_unitario: Number(it.producto.precio),
      subtotal: Number(it.subtotal),
    })),
  });
}
