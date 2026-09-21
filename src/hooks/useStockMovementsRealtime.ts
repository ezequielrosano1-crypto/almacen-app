import { useEffect } from "react";
import { toMovementRecord } from "../data/mappers";
import { supabase } from "../data/supabaseClient";
import type { StockMovementRow } from "../types/db";
import type { MovementRecordItem } from "../types/domain";
import { applyStockMovement } from "./useStockMovements";

export type RealtimeStockMovementPayload = StockMovementRow;

export function handleStockMovementRealtimeInsert(
  movimiento: RealtimeStockMovementPayload | null | undefined,
  setMovements: (updater: (prev: MovementRecordItem[]) => MovementRecordItem[]) => void,
) {
  if (!movimiento || movimiento.tipo === "venta") return;

  // Our own registrations come back here too (realtime echo): applyStockMovement skips
  // a movement that is already in the list, so it is never shown twice.
  setMovements((prev) => applyStockMovement(prev, toMovementRecord(movimiento)));
}

export function useStockMovementsRealtime(
  setMovements: (updater: (prev: MovementRecordItem[]) => MovementRecordItem[]) => void,
  client = supabase,
) {
  useEffect(() => {
    const canalStock = client
      .channel("movimientos-stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "movimientos_stock",
          filter: "negocio_id=eq.1",
        },
        (payload: unknown) => {
          handleStockMovementRealtimeInsert(
            (payload as { new: RealtimeStockMovementPayload }).new,
            setMovements,
          );
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(canalStock);
    };
  }, [setMovements, client]);
}

export default useStockMovementsRealtime;
