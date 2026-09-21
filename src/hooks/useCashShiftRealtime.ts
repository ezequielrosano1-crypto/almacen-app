import { useEffect } from "react";
import { supabase } from "../data/supabaseClient";

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
  setCashShift: (updater: (prev: any) => any) => void,
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
      return jornadaFormateada;
    }

    return prev;
  });
}

export function useCashShiftRealtime(
  setCashShift: (updater: (prev: any) => any) => void,
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
        (payload: any) => {
          handleCashShiftRealtimeEvent(payload, setCashShift);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(canal);
    };
  }, [setCashShift, client]);
}

export default useCashShiftRealtime;
