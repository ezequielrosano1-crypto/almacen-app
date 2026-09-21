import { useEffect, useState } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { closeShiftManually } from "../data/cashShiftRepository";
import { formatUruguayTime, todayDateKey } from "../lib/dates";
import { formatMoney } from "../lib/format";
import { readJson } from "../lib/storage/storage";
import type { StoredCashShift } from "../types/storage";

export interface DayClosingRecord {
  fecha: string;
  hora: string;
  total: number;
  cantidadVentas: number;
}

export interface DayClosingViewProps {
  todayTotal?: number;
  todayCashTotal?: number;
  todayDebitTotal?: number;
  todaySales?: any[];
  pop: () => void;
  cashShift?: StoredCashShift | null;
  onUpdateCashShift?: (shift: StoredCashShift) => void;

  // Aliases legacy para compatibilidad
  totalHoy?: number;
  efectivoHoy?: number;
  debitoHoy?: number;
  ventasHoy?: any[];
  caja?: StoredCashShift | null;
  actualizarCaja?: (shift: StoredCashShift) => void;
}

export function DayClosingView(props: DayClosingViewProps) {
  const { pop } = props;
  const totalHoy = props.todayTotal ?? props.totalHoy ?? 0;
  const efectivoHoy = props.todayCashTotal ?? props.efectivoHoy ?? 0;
  const debitoHoy = props.todayDebitTotal ?? props.debitoHoy ?? 0;
  const ventasHoy = props.todaySales ?? props.ventasHoy ?? [];
  const caja = props.cashShift ?? props.caja ?? null;
  const actualizarCaja = props.onUpdateCashShift ?? props.actualizarCaja;

  const claveHoy = `cierre:${todayDateKey()}`;
  const [cargando, setCargando] = useState(true);
  const [cierre, setCierre] = useState<DayClosingRecord | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const guardado = await readJson<DayClosingRecord>(claveHoy);
        if (activo && guardado) {
          setCierre(guardado);
        }
      } catch (_e) {
        // Todavía no existe un cierre guardado para hoy: se mantiene cierre en null
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, [claveHoy]);

  const confirmarCierre = async () => {
    if (guardando || cierre) return;
    setGuardando(true);
    setErrorGuardado(false);
    const registro: DayClosingRecord = {
      fecha: todayDateKey(),
      hora: formatUruguayTime(),
      total: totalHoy,
      cantidadVentas: ventasHoy.length,
    };
    try {
      if (!caja?.id) {
        throw new Error("No hay una jornada de caja activa.");
      }

      await closeShiftManually(caja.id, {
        estado: "CERRADA",
        hora_cierre: registro.hora,
        cerrado_automatico: false,
        total: Number(registro.total),
        cantidad_ventas: Number(registro.cantidadVentas),
        updated_at: new Date().toISOString(),
      });

      const cerrada: StoredCashShift = {
        ...(caja || ({} as StoredCashShift)),
        id: caja.id,
        fecha: todayDateKey(),
        estado: "CERRADA",
        horaCierre: registro.hora,
        cerradoAutomaticamente: false,
        total: Number(registro.total),
        cantidadVentas: Number(registro.cantidadVentas),
      };

      if (actualizarCaja) {
        actualizarCaja(cerrada);
      }
      setCierre(registro);
      setConfirmando(false);
    } catch (e) {
      console.error("Error guardando cierre de jornada:", e);
      setErrorGuardado(true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-5 space-y-3">
      <Header title="Cierre del día" onBack={pop} />
      <CashRegisterStatusCard caja={caja} totalHoy={totalHoy} />
      <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-stone-500 text-sm">Total del día</span>
          <span className="text-xl font-bold" style={{ color: "#2E6B4F" }}>
            {formatMoney(totalHoy)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Efectivo</span>
          <span className="text-stone-800 font-medium">{formatMoney(efectivoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Débito</span>
          <span className="text-stone-800 font-medium">{formatMoney(debitoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
          <span className="text-stone-500">Cantidad de ventas</span>
          <span className="text-stone-800 font-medium">{ventasHoy.length}</span>
        </div>
      </div>

      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-3">Verificando el estado del día...</p>
      ) : cierre ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-2">
          <p className="text-sm font-semibold" style={{ color: "#2E6B4F" }}>
            Día cerrado
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{cierre.fecha}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Hora de cierre</span>
            <span className="text-stone-800 font-medium">{cierre.hora}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Total cerrado</span>
            <span className="text-stone-800 font-medium">{formatMoney(cierre.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Cantidad de ventas</span>
            <span className="text-stone-800 font-medium">{cierre.cantidadVentas}</span>
          </div>
        </div>
      ) : confirmando ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <p className="text-stone-700 text-sm text-center">
            ¿Confirmás el cierre del día? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-2xl py-3 text-sm font-semibold border"
              style={{ backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }}
            >
              Cancelar
            </button>
            <PrimaryButton onClick={confirmarCierre} disabled={guardando}>
              Confirmar cierre
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div>
          <PrimaryButton onClick={() => setConfirmando(true)}>Cerrar día</PrimaryButton>
          {errorGuardado && (
            <p className="text-xs text-center mt-2" style={{ color: "#C0392B" }}>
              No se pudo guardar el cierre. Intentá nuevamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
