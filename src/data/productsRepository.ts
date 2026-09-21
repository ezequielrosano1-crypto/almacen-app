import type { ProductRow, ProductUpsert } from "../types/db";
import type { ProductId } from "../types/domain";
import { supabase } from "./supabaseClient";

export async function listProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase.from("productos").select("*").eq("negocio_id", 1);

  if (error) {
    throw error;
  }

  return (data || []) as ProductRow[];
}

export async function updateProductStock(id: ProductId, stock: number): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update({ stock: Number(stock) })
    .eq("id", id)
    .eq("negocio_id", 1);

  if (error) {
    throw error;
  }
}

export async function upsertProduct(row: ProductUpsert): Promise<void> {
  const { error } = await supabase.from("productos").upsert(row, { onConflict: "id" });

  if (error) {
    throw error;
  }
}
