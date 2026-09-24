import { Lock, LockOpen } from "lucide-react";
import type { ReactElement } from "react";
import { formatMoney } from "../lib/format";
import type { StoredCashShift } from "../types/storage";
import { Card } from "./ui/Card";
import { StatusBadge } from "./ui/StatusBadge";

export interface CashRegisterStatusCardProps {
  caja: StoredCashShift | null;
  totalHoy?: number;
}

interface Stat {
  label: string;
  value: string;
}

// Tarjeta visual con el estado de apertura/cierre de la jornada de caja y totales.
export function CashRegisterStatusCard({
  caja,
  totalHoy = 0,
}: CashRegisterStatusCardProps): ReactElement {
  const abierta = caja?.estado === "ABIERTA";
  const Icon = abierta ? LockOpen : Lock;

  const stats: Stat[] = abierta
    ? [
        { label: "Apertura", value: caja?.horaApertura || "—" },
        { label: "Vendido hoy", value: formatMoney(totalHoy || 0) },
      ]
    : [
        { label: "Cierre", value: caja?.horaCierre || "—" },
        { label: "Próxima apertura", value: "08:00" },
      ];

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            abierta ? "bg-success-50 text-success" : "bg-line-soft text-ink-muted"
          }`}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
        <div className="space-y-1">
          <p className="font-display text-base font-semibold text-ink">
            {abierta ? "Caja abierta" : "Caja cerrada"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={abierta ? "success" : "neutral"}>
              {abierta ? "Jornada actual" : "Jornada cerrada"}
            </StatusBadge>
            {caja?.cerradoAutomaticamente && (
              <span className="text-xs text-ink-subtle">Cierre automático</span>
            )}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-line-soft pt-4 sm:flex sm:gap-8 sm:border-t-0 sm:pt-0">
        {stats.map(({ label, value }) => (
          <div key={label} className="sm:text-right">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className="font-display text-lg font-bold text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
