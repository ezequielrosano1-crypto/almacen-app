import type {
  CashShiftCloseUpdate,
  CashShiftInsert,
  CashShiftReopenUpdate,
  CashShiftRow,
} from "../types/db";
import { supabase } from "./supabaseClient";

export async function findShiftByDate(date: string): Promise<CashShiftRow | null> {
  const { data, error } = await supabase
    .from("jornada")
    .select("*")
    .eq("negocio_id", 1)
    .eq("fecha", date)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as CashShiftRow | null;
}

export async function closeShift(id: string, p: CashShiftCloseUpdate): Promise<void> {
  const { error } = await supabase.from("jornada").update(p).eq("id", id).eq("negocio_id", 1);

  if (error) {
    throw error;
  }
}

export async function createShift(row: CashShiftInsert): Promise<CashShiftRow> {
  const { data, error } = await supabase.from("jornada").insert(row).select().single();

  if (error) {
    throw error;
  }

  return data as CashShiftRow;
}

export async function closeShiftManually(id: string, p: CashShiftCloseUpdate): Promise<void> {
  return closeShift(id, p);
}

export async function reopenShift(id: string, p: CashShiftReopenUpdate): Promise<CashShiftRow> {
  const { data, error } = await supabase
    .from("jornada")
    .update(p)
    .eq("id", id)
    .eq("negocio_id", 1)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as CashShiftRow;
}

export async function listClosedShifts(): Promise<CashShiftRow[]> {
  const { data, error } = await supabase
    .from("jornada")
    .select("*")
    .eq("negocio_id", 1)
    .eq("estado", "CERRADA")
    .order("fecha", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as CashShiftRow[];
}
