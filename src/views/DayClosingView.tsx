import { useState } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { closeShiftManually } from "../data/cashShiftRepository";
import { storedShiftToClosingSummary } from "../data/mappers";
import { formatUruguayTime, todayDateKey } from "../lib/dates";
import { formatMoney } from "../lib/format";
import type { ClosingSummary, MovementRecordItem } from "../types/domain";
import type { StoredCashShift } from "../types/storage";

export interface DayClosingViewProps {
  todayTotal?: number;
  todayCashTotal?: number;
  todayDebitTotal?: number;
  todaySales?: MovementRecordItem[];
  pop: () => void;
  cashShift?: StoredCashShift | null;
  onUpdateCashShift?: (shift: StoredCashShift) => void;
}

export function DayClosingView(props: DayClosingViewProps) {
  const { pop } = props;
  const totalHoy = props.todayTotal ?? 0;
  const efectivoHoy = props.todayCashTotal ?? 0;
  const debitoHoy = props.todayDebitTotal ?? 0;
  const ventasHoy = props.todaySales ?? [];
  const caja = props.cashShift ?? null;
  const actualizarCaja = props.onUpdateCashShift;

  // The jornada loaded from the database is the closing record; the local state only
  // covers the moment right after confirming, before the parent refreshes `cashShift`.
  const [cierreLocal, setCierreLocal] = useState<ClosingSummary | null>(null);
  const cierre = storedShiftToClosingSummary(caja) ?? cierreLocal;
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  const confirmarCierre = async () => {
    if (guardando || cierre) return;
    setGuardando(true);
    setErrorGuardado(false);
    const registro: ClosingSummary = {
      date: todayDateKey(),
      time: formatUruguayTime(),
      total: totalHoy,
      salesCount: ventasHoy.length,
    };
    try {
      if (!caja?.id) {
        throw new Error("No hay una jornada de caja activa.");
      }

      await closeShiftManually(caja.id, {
        estado: "CERRADA",
        hora_cierre: registro.time,
        cerrado_automatico: false,
        total: Number(registro.total),
        cantidad_ventas: Number(registro.salesCount),
        updated_at: new Date().toISOString(),
      });

      const cerrada: StoredCashShift = {
        ...(caja || ({} as StoredCashShift)),
        id: caja.id,
        fecha: todayDateKey(),
        estado: "CERRADA",
        horaCierre: registro.time,
        cerradoAutomaticamente: false,
        total: Number(registro.total),
        cantidadVentas: Number(registro.salesCount),
      };

      if (actualizarCaja) {
        actualizarCaja(cerrada);
      }
      setCierreLocal(registro);
      setConfirmando(false);
    } catch (e) {
      console.error("Error guardando cierre de jornada:", e);
      setErrorGuardado(true);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="pb-4 space-y-3 lg:max-w-2xl">
      <PageHeader title="Cierre del día" onBack={pop} />
      <CashRegisterStatusCard caja={caja} totalHoy={totalHoy} />
      <Card className="space-y-3">
        <div className="flex justify-between">
          <span className="text-ink-muted text-sm">Total del día</span>
          <span className="text-xl font-display font-bold text-brand">{formatMoney(totalHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Efectivo</span>
          <span className="text-ink font-medium">{formatMoney(efectivoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Débito</span>
          <span className="text-ink font-medium">{formatMoney(debitoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-line-soft pt-3">
          <span className="text-ink-muted">Cantidad de ventas</span>
          <span className="text-ink font-medium">{ventasHoy.length}</span>
        </div>
      </Card>

      {cierre ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-brand">Día cerrado</p>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Fecha</span>
            <span className="text-ink font-medium">{cierre.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Hora de cierre</span>
            <span className="text-ink font-medium">{cierre.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Total cerrado</span>
            <span className="text-ink font-medium">{formatMoney(cierre.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Cantidad de ventas</span>
            <span className="text-ink font-medium">{cierre.salesCount}</span>
          </div>
        </Card>
      ) : confirmando ? (
        <Card className="space-y-3">
          <p className="text-ink-soft text-sm text-center">
            ¿Confirmás el cierre del día? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCierre} disabled={guardando}>
              Confirmar cierre
            </Button>
          </div>
        </Card>
      ) : (
        <div>
          <Button fullWidth onClick={() => setConfirmando(true)}>
            Cerrar día
          </Button>
          {errorGuardado && (
            <p className="text-xs text-center mt-2 text-danger">
              No se pudo guardar el cierre. Intentá nuevamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
