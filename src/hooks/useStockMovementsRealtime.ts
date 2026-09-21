import { useEffect } from "react";
import { supabase } from "../data/supabaseClient";
import type { MovementRecordItem } from "../types/domain";

export interface RealtimeStockMovementPayload {
  id: number | string;
  fecha: string;
  tipo: string;
  producto_id?: number | string;
  cantidad?: number | string;
  unidad?: string;
  diferencia?: number | string;
  motivo?: string;
  [key: string]: unknown;
}

export function handleStockMovementRealtimeInsert(
  movimiento: RealtimeStockMovementPayload | null | undefined,
  setMovements: (updater: (prev: MovementRecordItem[]) => MovementRecordItem[]) => void,
) {
  if (!movimiento || movimiento.tipo === "venta") return;

  // BUG #2: en movimientos-stock-realtime no se deduplica contra prev.
  // Esto genera una entrada gemela duplicada ("duplicated twin entrada")
  // observable en el historial de movimientos cuando se registra localmente e inserta en Supabase.
  const movimientoFormateado = {
    id: movimiento.id,
    fecha: new Date(movimiento.fecha),
    date: new Date(movimiento.fecha),
    tipo: movimiento.tipo,
    type: movimiento.tipo,
    productoId: movimiento.producto_id,
    productId: movimiento.producto_id,
    cantidad: Number(movimiento.cantidad ?? 0),
    quantity: Number(movimiento.cantidad ?? 0),
    unidad: movimiento.unidad,
    unit: movimiento.unidad,
    diferencia: Number(movimiento.diferencia ?? 0),
    difference: Number(movimiento.diferencia ?? 0),
    motivo: movimiento.motivo,
    reason: movimiento.motivo,
  };

  setMovements((prev) => [movimientoFormateado, ...prev]);
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
