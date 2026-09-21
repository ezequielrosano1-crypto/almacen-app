import type {
  RegisterStockMovementInput,
  RegisterStockMovementResult,
  StockMovementRow,
} from "../types/db";
import { supabase } from "./supabaseClient";

// One transaction on the server: it locks the product, computes the new stock (and the
// difference for an adjustment), updates the product and writes the movement.
export async function registerStockMovement(
  input: RegisterStockMovementInput,
): Promise<RegisterStockMovementResult> {
  const { data, error } = await supabase.rpc("registrar_movimiento_stock", {
    p_negocio_id: 1,
    p_producto_id: input.producto_id,
    p_tipo: input.tipo,
    p_cantidad: input.cantidad,
    p_motivo: input.motivo ?? null,
  });

  if (error) {
    throw error;
  }

  return data as RegisterStockMovementResult;
}

// Sales are read from `ventas`; this list only holds entradas and ajustes.
export async function listStockMovements(): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from("movimientos_stock")
    .select("*")
    .eq("negocio_id", 1)
    .in("tipo", ["entrada", "ajuste"])
    .order("fecha", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as StockMovementRow[];
}
