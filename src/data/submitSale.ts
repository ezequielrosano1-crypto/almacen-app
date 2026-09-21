import { updateProductStock } from "./productsRepository";
import { createSale, deleteSale, insertSaleItems } from "./salesRepository";

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
  createSale: typeof createSale;
  insertSaleItems: typeof insertSaleItems;
  deleteSale: typeof deleteSale;
  updateProductStock: typeof updateProductStock;
}

const defaultDeps: SubmitSaleDeps = {
  createSale,
  insertSaleItems,
  deleteSale,
  updateProductStock,
};

export async function submitSale(input: SubmitSaleInput, deps: SubmitSaleDeps = defaultDeps) {
  const { total, pago, items } = input;
  const venta = await deps.createSale({
    negocio_id: 1,
    jornada_id: null,
    fecha: new Date().toISOString(),
    total: Number(total),
    pago,
  });

  const itemsVenta = items.map((it) => ({
    venta_id: venta.id,
    producto_id: it.producto.id,
    nombre: it.producto.nombre,
    cantidad: Number(it.cantidad),
    unidad: it.producto.unidad,
    precio_unitario: Number(it.producto.precio),
    subtotal: Number(it.subtotal),
  }));

  try {
    await deps.insertSaleItems(itemsVenta);
  } catch (errorItems) {
    await deps.deleteSale(venta.id);
    throw errorItems;
  }

  // BUG #5: Asimetría de rollback. Si la actualización de stock falla en alguno
  // de los items (por ejemplo, en el segundo), NO se ejecuta deleteSale ni se
  // revierte el stock de los items anteriores ya actualizados. Preservamos este
  // comportamiento verbatim según especificación (Decision D6/D7).
  for (const it of items) {
    const nuevoStock = Math.round((it.producto.stock - it.cantidad) * 100) / 100;
    await deps.updateProductStock(it.producto.id, nuevoStock);
  }

  return venta;
}
