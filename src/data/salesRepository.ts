import type { SaleInsert, SaleItemInsert, SaleItemRow, SaleWithItemsRow } from "../types/db";
import { supabase } from "./supabaseClient";

export async function createSale(payload: SaleInsert): Promise<{ id: number }> {
  const { data, error } = await supabase.from("ventas").insert(payload).select().single();

  if (error) {
    throw error;
  }

  return data as { id: number };
}

export async function insertSaleItems(rows: SaleItemInsert[]): Promise<void> {
  const { error } = await supabase.from("venta_items").insert(rows);

  if (error) {
    throw error;
  }
}

export async function deleteSale(id: number): Promise<void> {
  const { error } = await supabase.from("ventas").delete().eq("id", id).eq("negocio_id", 1);

  if (error) {
    throw error;
  }
}

export async function listSalesWithItems(): Promise<SaleWithItemsRow[]> {
  const { data, error } = await supabase
    .from("ventas")
    .select(`
      id,
      negocio_id,
      fecha,
      total,
      pago,
      venta_items (
        id,
        producto_id,
        nombre,
        cantidad,
        unidad,
        precio_unitario,
        subtotal
      )
    `)
    .eq("negocio_id", 1)
    .order("fecha", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as SaleWithItemsRow[];
}

export async function listSaleItems(saleId: number): Promise<SaleItemRow[]> {
  const { data, error } = await supabase.from("venta_items").select("*").eq("venta_id", saleId);

  if (error) {
    throw error;
  }

  return (data || []) as SaleItemRow[];
}
