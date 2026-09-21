import { useCallback, useState } from "react";
import { reopenShift } from "../data/cashShiftRepository";
import { nowInUruguay } from "../lib/dates";
import type { CashShiftReopenUpdate, CashShiftRow } from "../types/db";
import type { ClockOverride, UruguayClock } from "../types/domain";
import type { StoredCashShift } from "../types/storage";

export interface OpenCashShiftDeps {
  reopenShift: (id: string, payload: CashShiftReopenUpdate) => Promise<CashShiftRow>;
  now: (override?: ClockOverride) => UruguayClock;
}

export const defaultOpenCashShiftDeps: OpenCashShiftDeps = {
  reopenShift,
  now: nowInUruguay,
};

// Apertura manual: solo tiene sentido dentro del horario habilitado (08:00–22:00).
// NOTA (Bug #12 preservado): el comentario original afirmaba que además de abrir la
// jornada borraba el registro de cierre guardado para hoy ("cierre:<fecha>"), pero el
// código real NO realiza ninguna eliminación en storage. Reabre la jornada en base de
// datos llamando a reopenShift. El cierre y la apertura automáticos (syncCashShift)
// continúan funcionando igual después de esto: a las 22:00 se cierra sola y al día
// siguiente a las 08:00 se abre una nueva jornada.
export async function openCashShift(
  deps: OpenCashShiftDeps = defaultOpenCashShiftDeps,
): Promise<StoredCashShift | null> {
  const ahora = deps.now();

  if (ahora.hourNumber < 8 || ahora.hourNumber >= 22) {
    return null;
  }

  const nueva = {
    id: `caja-${ahora.date}`,
    fecha: ahora.date,
    estado: "ABIERTA",
    horaApertura: ahora.time,
    horaCierre: null,
    cerradoAutomaticamente: false,
  };

  const data = await deps.reopenShift(nueva.id, {
    estado: "ABIERTA",
    hora_apertura: nueva.horaApertura,
    hora_cierre: null,
    cerrado_automatico: false,
    updated_at: new Date().toISOString(),
  });

  const jornadaAbierta: StoredCashShift = {
    id: data.id,
    fecha: data.fecha,
    estado: data.estado,
    horaApertura: data.hora_apertura,
    horaCierre: data.hora_cierre,
    cerradoAutomaticamente: data.cerrado_automatico,
    total: Number(data.total || 0),
    cantidadVentas: Number(data.cantidad_ventas || 0),
  };

  return jornadaAbierta;
}

export function useCashRegister(deps: OpenCashShiftDeps = defaultOpenCashShiftDeps) {
  const [cashShift, setCashShift] = useState<StoredCashShift | null>(null);

  const openCashShiftManually = useCallback(async (): Promise<StoredCashShift | null> => {
    try {
      const abierta = await openCashShift(deps);
      if (abierta) {
        setCashShift(abierta);
      }
      return abierta;
    } catch (e) {
      console.error("Error abriendo jornada:", e);
      if (typeof alert !== "undefined") {
        alert("No se pudo abrir la caja.");
      }
      return null;
    }
  }, [deps]);

  return {
    cashShift,
    setCashShift,
    openCashShiftManually,
  };
}
