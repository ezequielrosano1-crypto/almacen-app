import { useState } from "react";
import { insertStockEntry as defaultInsertStockEntry } from "../data/stockMovementsRepository";
import { nextId as defaultNextId } from "../lib/ids";
import { initialStockMovements } from "../lib/initialData";
import type { MovementRecordItem } from "../types/domain";

export interface StockMovementInput {
  tipo?: string;
  type?: string;
  productoId?: number | string;
  productId?: number | string;
  cantidad?: number;
  quantity?: number;
  unidad?: string;
  unit?: string;
  diferencia?: number;
  motivo?: string;
  reason?: string;
  [key: string]: unknown;
}

export function applyStockMovement<T>(movements: T[], movement: T): T[] {
  return [movement, ...movements];
}

export async function recordStockMovementToRepository(
  mov: StockMovementInput,
  fecha: Date,
  deps = { insertStockEntry: defaultInsertStockEntry },
): Promise<boolean> {
  const tipo = mov.tipo ?? mov.type;

  // BUG #3: Solo los movimientos de tipo "entrada" se insertan en Supabase (movimientos_stock).
  // Los ajustes de stock ("ajuste") NO llaman a insertStockEntry y solo persisten localmente.
  if (tipo === "entrada") {
    console.log("REGISTRANDO MOVIMIENTO:", mov);

    try {
      await deps.insertStockEntry({
        negocio_id: 1,
        producto_id: (mov.productoId ?? mov.productId) as number | string,
        jornada_id: null,
        fecha: fecha.toISOString(),
        tipo: "entrada",
        cantidad: Number(mov.cantidad ?? mov.quantity ?? 0),
        unidad: (mov.unidad ?? mov.unit ?? "unidad") as string,
        diferencia: Number(mov.cantidad ?? mov.quantity ?? 0),
        motivo: "Entrada de stock",
      });
    } catch (error) {
      console.error("Error guardando movimiento de entrada:", error);
      if (typeof alert !== "undefined") {
        alert("No se pudo guardar el movimiento de stock.");
      }
      return false;
    }
  }

  return true;
}

export function useStockMovements(
  initial: MovementRecordItem[] = initialStockMovements() as unknown as MovementRecordItem[],
  deps = {
    insertStockEntry: defaultInsertStockEntry,
    nextId: defaultNextId,
  },
) {
  const [movements, setMovements] = useState<MovementRecordItem[]>(initial);

  const recordStockMovement = async (mov: StockMovementInput): Promise<boolean> => {
    const fecha = new Date();
    const movimiento = {
      id: deps.nextId(),
      fecha,
      ...mov,
    };

    const ok = await recordStockMovementToRepository(mov, fecha, deps);
    if (!ok) return false;

    setMovements((m) => applyStockMovement(m, movimiento));
    return true;
  };

  return {
    movements,
    setMovements,
    recordStockMovement,
    // Alias en español para App.jsx
    movimientos: movements,
    setMovimientos: setMovements,
    registrarMovimiento: recordStockMovement,
  };
}

export default useStockMovements;
