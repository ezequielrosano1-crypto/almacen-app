import type { StockMovementInsert } from "../types/db";
import { supabase } from "./supabaseClient";

export async function insertStockEntry(payload: StockMovementInsert): Promise<void> {
  const { error } = await supabase.from("movimientos_stock").insert(payload);

  if (error) {
    throw error;
  }
}
