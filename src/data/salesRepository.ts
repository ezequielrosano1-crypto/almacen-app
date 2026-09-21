import type { RegisterSaleInput, SaleItemRow, SaleRow, SaleWithItemsRow } from "../types/db";
import { supabase } from "./supabaseClient";

export async function registerSale(input: RegisterSaleInput): Promise<SaleRow> {
  const { data, error } = await supabase.rpc("registrar_venta", {
    p_negocio_id: input.negocio_id,
    p_jornada_id: input.jornada_id,
    p_pago: input.pago,
    p_total: input.total,
    p_items: input.items,
  });

  if (error) {
    throw error;
  }

  return data as SaleRow;
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
