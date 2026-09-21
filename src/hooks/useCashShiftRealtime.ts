import { useEffect } from "react";
import { supabase } from "../data/supabaseClient";
import type { StoredCashShift } from "../types/storage";

export interface RealtimeCashShiftPayload {
  new?: {
    id: number | string;
    fecha: string;
    estado: string;
    hora_apertura?: string | null;
    hora_cierre?: string | null;
    cerrado_automatico?: boolean | null;
    total?: number | string | null;
    cantidad_ventas?: number | string | null;
    [key: string]: unknown;
  } | null;
}

export function handleCashShiftRealtimeEvent(
  payload: RealtimeCashShiftPayload,
  setCashShift: (updater: (prev: StoredCashShift | null) => StoredCashShift | null) => void,
) {
  const jornada = payload.new;

  if (!jornada) return;

  const jornadaFormateada = {
    id: jornada.id,
    fecha: jornada.fecha,
    estado: jornada.estado,
    horaApertura: jornada.hora_apertura,
    horaCierre: jornada.hora_cierre,
    cerradoAutomaticamente: jornada.cerrado_automatico,
    total: Number(jornada.total || 0),
    cantidadVentas: Number(jornada.cantidad_ventas || 0),
  };

  // Se ignora el evento si ya hay una jornada distinta cargada.
  setCashShift((prev) => {
    if (!prev || prev.id === jornadaFormateada.id) {
      // El payload de Supabase puede traer id numérico u hora nula; se preserva tal cual el
      // comportamiento original y solo se ajusta el tipo al de la jornada almacenada.
      return jornadaFormateada as StoredCashShift;
    }

    return prev;
  });
}

export function useCashShiftRealtime(
  setCashShift: (updater: (prev: StoredCashShift | null) => StoredCashShift | null) => void,
  client = supabase,
) {
  useEffect(() => {
    const canal = client
      .channel("jornada-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jornada",
          filter: "negocio_id=eq.1",
        },
        (payload: unknown) => {
          handleCashShiftRealtimeEvent(payload as RealtimeCashShiftPayload, setCashShift);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(canal);
    };
  }, [setCashShift, client]);
}

export default useCashShiftRealtime;
