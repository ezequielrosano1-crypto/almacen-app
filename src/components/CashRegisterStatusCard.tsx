import type { ReactElement } from "react";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import type { StoredCashShift } from "../types/storage";

export interface CashRegisterStatusCardProps {
  caja: StoredCashShift | null;
  totalHoy?: number;
}

// Tarjeta visual con el estado de apertura/cierre de la jornada de caja y totales.
export function CashRegisterStatusCard({
  caja,
  totalHoy = 0,
}: CashRegisterStatusCardProps): ReactElement {
  const abierta = caja?.estado === "ABIERTA";
  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{abierta ? "🟢" : "🔴"}</span>
          <span className="text-sm font-semibold text-ink">
            {abierta ? "Caja abierta" : "Caja cerrada"}
          </span>
          {caja?.cerradoAutomaticamente && (
            <span className="text-[10px] text-ink-subtle">(cierre automático)</span>
          )}
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: abierta ? COLORS.principal : COLORS.agotado }}
        >
          {abierta ? "Jornada actual" : "Jornada cerrada"}
        </span>
      </div>
      <div className="flex justify-between text-xs text-ink-muted border-t border-line-soft pt-2">
        {abierta ? (
          <>
            <span>
              Apertura: <strong className="text-ink-soft">{caja?.horaApertura || "—"}</strong>
            </span>
            <span>
              Vendido hoy: <strong className="text-ink-soft">{formatMoney(totalHoy || 0)}</strong>
            </span>
          </>
        ) : (
          <>
            <span>
              Cierre: <strong className="text-ink-soft">{caja?.horaCierre || "—"}</strong>
            </span>
            <span>
              Próxima apertura: <strong className="text-ink-soft">08:00</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
