import { CASH_SHIFT_STORAGE_KEY } from "../lib/constants";
import { localDateKey, nowInUruguay } from "../lib/dates";
import type { CashShiftCloseUpdate, CashShiftInsert, CashShiftRow } from "../types/db";
import type { ClockOverride, UruguayClock } from "../types/domain";
import type { StoredCashShift, StoredClosingSummary } from "../types/storage";
import type { StorageShim } from "../types/window";
import { closeShift, createShift, findShiftByDate } from "./cashShiftRepository";

export type ClockOverrideInput = ClockOverride | { fecha: string; horaNumero: number };

export interface CashShiftSyncOptions {
  override?: ClockOverrideInput;
  storageKey?: string;
}

export interface CashShiftSyncRepository {
  findShiftByDate: (date: string) => Promise<CashShiftRow | null>;
  closeShift: (id: string, payload: CashShiftCloseUpdate) => Promise<void>;
  createShift: (row: CashShiftInsert) => Promise<CashShiftRow>;
}

export interface CashShiftSyncDeps {
  repository: CashShiftSyncRepository;
  storage: Pick<StorageShim, "get" | "set">;
  now: (override?: ClockOverride) => UruguayClock;
}

export const defaultCashShiftSyncDeps: CashShiftSyncDeps = {
  repository: {
    findShiftByDate,
    closeShift,
    createShift,
  },
  storage: {
    get: (key, shared) => window.storage.get(key, shared),
    set: (key, value, shared) => window.storage.set(key, value, shared),
  },
  now: nowInUruguay,
};

export interface GenericStockMovement {
  tipo?: string;
  type?: string;
  fecha?: string | Date;
  date?: string | Date;
  total?: number;
}

function normalizeOverride(override?: ClockOverrideInput): ClockOverride | undefined {
  if (!override) return undefined;
  if ("hourNumber" in override && "date" in override) {
    return override;
  }
  const legacy = override as { fecha: string; horaNumero: number };
  return {
    date: legacy.fecha,
    hourNumber: legacy.horaNumero,
  };
}

export async function syncCashShift(
  stockMovements: GenericStockMovement[] = [],
  options: CashShiftSyncOptions = {},
  deps: CashShiftSyncDeps = defaultCashShiftSyncDeps,
): Promise<StoredCashShift | null> {
  const { override, storageKey = CASH_SHIFT_STORAGE_KEY } = options;
  const claveCierre = (fecha: string) =>
    storageKey === CASH_SHIFT_STORAGE_KEY ? `cierre:${fecha}` : `${storageKey}:cierre:${fecha}`;

  const ahora = deps.now(normalizeOverride(override));
  const abiertaPorHorario = ahora.hourNumber >= 8 && ahora.hourNumber < 22;
  let actual: StoredCashShift | null = null;

  try {
    if (storageKey === CASH_SHIFT_STORAGE_KEY) {
      const data = await deps.repository.findShiftByDate(ahora.date);

      if (data) {
        actual = {
          id: data.id,
          fecha: data.fecha,
          estado: data.estado,
          horaApertura: data.hora_apertura,
          horaCierre: data.hora_cierre,
          cerradoAutomaticamente: data.cerrado_automatico,
          total: Number(data.total || 0),
          cantidadVentas: Number(data.cantidad_ventas || 0),
        };
      }
    } else {
      const resultado = await deps.storage.get(storageKey, false);
      if (resultado?.value) {
        actual = JSON.parse(resultado.value);
      }
    }
  } catch (e) {
    console.error("Error cargando jornada:", e);
  }

  // Cerrar una jornada que quedó abierta cuando ya pasó la hora de cierre
  // (22:00) o cuando cambió el día sin que nadie la cerrara a tiempo.
  if (actual?.estado === "ABIERTA" && (!abiertaPorHorario || actual.fecha !== ahora.date)) {
    const ventasJornada = stockMovements.filter((m) => {
      const isSale = m.tipo === "venta" || m.type === "venta";
      const mDate = m.fecha ?? m.date;
      return isSale && mDate !== undefined && localDateKey(mDate) === actual?.fecha;
    });

    const cierre: StoredCashShift = {
      ...actual,
      estado: "CERRADA",
      horaCierre: "22:00",
      cerradoAutomaticamente: true,
    };

    const resumen: StoredClosingSummary = {
      fecha: actual.fecha,
      hora: "22:00",
      total: ventasJornada.reduce((a, v) => a + (Number(v.total) || 0), 0),
      cantidadVentas: ventasJornada.length,
      automatico: true,
    };

    try {
      if (storageKey === CASH_SHIFT_STORAGE_KEY) {
        await deps.repository.closeShift(actual.id, {
          estado: cierre.estado,
          hora_cierre: cierre.horaCierre || "22:00",
          cerrado_automatico: cierre.cerradoAutomaticamente,
          total: resumen.total,
          cantidad_ventas: resumen.cantidadVentas,
          updated_at: new Date().toISOString(),
        });
      } else {
        await deps.storage.set(storageKey, JSON.stringify(cierre), false);
        await deps.storage.set(claveCierre(actual.fecha), JSON.stringify(resumen), false);
      }
    } catch (e) {
      console.error("Error guardando cierre de jornada:", e);
    }
    actual = cierre;
  }

  // Abrir una única jornada para el día actual dentro del horario.
  // OJO: la condición NO vuelve a mirar el estado ("ABIERTA"/"CERRADA") de la
  // jornada de hoy, solo si YA EXISTE un registro para la fecha de hoy. Así,
  // una jornada cerrada manualmente antes de las 22:00 queda cerrada el
  // resto del día y no se reabre en la siguiente verificación (bug que
  // existía antes: reabría apenas el usuario cerraba caja manualmente).
  if (abiertaPorHorario && (!actual || actual.fecha !== ahora.date)) {
    const nueva: StoredCashShift = {
      id: `caja-${ahora.date}`,
      fecha: ahora.date,
      estado: "ABIERTA",
      horaApertura: ahora.time,
      horaCierre: null,
      cerradoAutomaticamente: false,
    };

    try {
      if (storageKey === CASH_SHIFT_STORAGE_KEY) {
        const data = await deps.repository.createShift({
          id: nueva.id,
          negocio_id: 1,
          fecha: nueva.fecha,
          estado: nueva.estado,
          hora_apertura: nueva.horaApertura,
          hora_cierre: nueva.horaCierre,
          cerrado_automatico: nueva.cerradoAutomaticamente,
          total: 0,
          cantidad_ventas: 0,
        });

        nueva.id = data.id;
      } else {
        await deps.storage.set(storageKey, JSON.stringify(nueva), false);
      }
    } catch (e) {
      console.error("Error guardando jornada:", e);
    }
    actual = nueva;
  }

  return actual;
}
