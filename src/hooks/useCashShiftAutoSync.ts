import { useEffect } from "react";
import { type GenericStockMovement, syncCashShift } from "../data/cashShiftSync";
import type { StoredCashShift } from "../types/storage";

export const CASH_SHIFT_SYNC_INTERVAL_MS = 30000;

type SyncFn = (movements: GenericStockMovement[]) => Promise<StoredCashShift | null>;

// Sincroniza al montar y luego cada 30 s; devuelve la función de limpieza.
export function startCashShiftAutoSync(
  movements: GenericStockMovement[],
  setCashShift: (shift: StoredCashShift | null) => void,
  sync: SyncFn = syncCashShift,
): () => void {
  let activo = true;
  const verificarCaja = async () => {
    const estado = await sync(movements);
    if (activo) setCashShift(estado);
  };
  verificarCaja();
  const intervalo = setInterval(verificarCaja, CASH_SHIFT_SYNC_INTERVAL_MS);
  return () => {
    activo = false;
    clearInterval(intervalo);
  };
}

export function useCashShiftAutoSync(
  movements: GenericStockMovement[],
  setCashShift: (shift: StoredCashShift | null) => void,
): void {
  useEffect(() => startCashShiftAutoSync(movements, setCashShift), [movements, setCashShift]);
}
