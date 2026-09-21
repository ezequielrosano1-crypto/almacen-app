import { useState } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Header } from "../components/Header";
import { Row } from "../components/Row";
import { COLORS } from "../lib/constants";
import type { ScreenId } from "../types/navigation";
import type { StoredCashShift } from "../types/storage";

export interface SalesViewProps {
  push: (screen: ScreenId) => void;
  cashShift?: StoredCashShift | null;
  todayTotal?: number;
  openCashShiftManually?: () => Promise<unknown>;

  // Aliases legacy para compatibilidad
  caja?: StoredCashShift | null;
  totalHoy?: number;
  abrirCajaManual?: () => Promise<unknown>;
}

export function SalesView(props: SalesViewProps) {
  const { push } = props;
  const cashShift = props.cashShift ?? props.caja ?? null;
  const todayTotal = props.todayTotal ?? props.totalHoy ?? 0;
  const openCashShift = props.openCashShiftManually ?? props.abrirCajaManual;

  const [avisoFueraHorario, setAvisoFueraHorario] = useState(false);
  const [abriendo, setAbriendo] = useState(false);

  const tocarAbrir = async () => {
    if (!openCashShift) return;
    setAbriendo(true);
    const resultado = await openCashShift();
    setAbriendo(false);
    if (!resultado) {
      setAvisoFueraHorario(true);
      setTimeout(() => setAvisoFueraHorario(false), 3500);
    }
  };

  return (
    <div>
      <Header title="Ventas" />
      <div className="px-5 space-y-3">
        <CashRegisterStatusCard caja={cashShift} totalHoy={todayTotal} />
        {cashShift?.estado !== "ABIERTA" && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={tocarAbrir}
              disabled={abriendo}
              className="w-full font-semibold rounded-2xl py-3 text-sm shadow-sm border flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
            >
              Abrir caja ahora (manual)
            </button>
            {avisoFueraHorario && (
              <p className="text-xs text-center" style={{ color: COLORS.agotado }}>
                Solo se puede abrir manualmente entre 08:00 y 22:00.
              </p>
            )}
          </div>
        )}
        <Row label="Nueva venta" onClick={() => push("newSale")} />
        <Row label="Cierre del día" onClick={() => push("dayClosing")} />
        <Row label="Historial de cierres" onClick={() => push("closingHistory")} />
      </div>
    </div>
  );
}
