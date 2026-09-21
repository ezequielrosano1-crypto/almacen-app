import { useState } from "react";
import { toMovementRecord } from "../data/mappers";
import { registerStockMovement as defaultRegisterStockMovement } from "../data/stockMovementsRepository";
import { initialStockMovements } from "../lib/initialData";
import type { RegisterStockMovementResult } from "../types/db";
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

const isSale = (m: { tipo?: string; type?: string }) => (m.tipo ?? m.type) === "venta";

// Stock movements and sales come from different tables, so their ids live in separate
// spaces: only dedupe among non-sale movements. The same movement can arrive twice (our
// own RPC result and the realtime echo of it), and must be shown once.
export function applyStockMovement<T extends { id: number | string; tipo?: string; type?: string }>(
  movements: T[],
  movement: T,
): T[] {
  const duplicate =
    !isSale(movement) && movements.some((m) => !isSale(m) && String(m.id) === String(movement.id));

  return duplicate ? movements : [movement, ...movements];
}

// Returns the server result (movement row + new product stock) or null on failure.
export async function recordStockMovementToRepository(
  mov: StockMovementInput,
  deps = { registerStockMovement: defaultRegisterStockMovement },
): Promise<RegisterStockMovementResult | null> {
  const tipo = mov.tipo ?? mov.type;
  const productoId = mov.productoId ?? mov.productId;

  if ((tipo !== "entrada" && tipo !== "ajuste") || productoId === undefined) {
    console.error("Movimiento de stock inválido:", mov);
    return null;
  }

  try {
    return await deps.registerStockMovement({
      producto_id: productoId,
      tipo,
      cantidad: Number(mov.cantidad ?? mov.quantity ?? 0),
      motivo: mov.motivo ?? mov.reason ?? null,
    });
  } catch (error) {
    console.error("Error guardando movimiento de stock:", error);
    if (typeof alert !== "undefined") {
      alert("No se pudo guardar el movimiento de stock.");
    }
    return null;
  }
}

export function useStockMovements(
  initial: MovementRecordItem[] = initialStockMovements() as unknown as MovementRecordItem[],
  deps = { registerStockMovement: defaultRegisterStockMovement },
) {
  const [movements, setMovements] = useState<MovementRecordItem[]>(initial);

  // The record shown in the list is the row the server saved (real id, product name), so
  // the realtime echo of the same insert is recognised and skipped.
  const recordStockMovement = async (
    mov: StockMovementInput,
  ): Promise<RegisterStockMovementResult | null> => {
    const saved = await recordStockMovementToRepository(mov, deps);
    if (!saved) return null;

    setMovements((m) => applyStockMovement(m, toMovementRecord(saved.movimiento)));
    return saved;
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
