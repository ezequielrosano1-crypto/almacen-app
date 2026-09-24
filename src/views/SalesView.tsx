import { ArrowRight, History, Lock, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { COLORS } from "../lib/constants";
import { formatDate, formatMoney } from "../lib/format";
import type { MovementRecordItem } from "../types/domain";
import type { ScreenId } from "../types/navigation";
import type { StoredCashShift } from "../types/storage";

export interface SalesViewProps {
  push: (screen: ScreenId) => void;
  cashShift?: StoredCashShift | null;
  todayTotal?: number;
  todaySales?: MovementRecordItem[];
  openCashShiftManually?: () => Promise<unknown>;
}

export function SalesView(props: SalesViewProps) {
  const { push } = props;
  const cashShift = props.cashShift ?? null;
  const todayTotal = props.todayTotal ?? 0;
  const todaySales = props.todaySales ?? [];
  const openCashShift = props.openCashShiftManually;

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

  const ultimasVentas = [...todaySales]
    .sort((a, b) => new Date(b.fecha ?? b.date ?? 0).getTime() - new Date(a.fecha ?? a.date ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="pb-4 space-y-5">
      <PageHeader title="Ventas" subtitle="Registrá una nueva venta o consultá el historial." />

      <button
        type="button"
        onClick={() => push("newSale")}
        className="w-full rounded-2xl bg-brand text-white p-5 text-left flex items-center justify-between shadow-sm"
      >
        <div>
          <p className="font-display text-lg font-bold">Nueva venta</p>
          <p className="text-white/80 text-sm">Punto de venta</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <ShoppingCart size={22} />
        </span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => push("dayClosing")}
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-sm"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <Lock size={18} color="#0066FF" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-ink">Cierre de caja</p>
            <p className="text-ink-muted text-xs">Cerrá la jornada y revisá el total.</p>
          </div>
          <ArrowRight size={18} color="#94A3B8" />
        </button>
        <button
          type="button"
          onClick={() => push("closingHistory")}
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-sm"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <History size={18} color="#0066FF" />
          </span>
          <div className="flex-1">
            <p className="font-medium text-ink">Historial de cierres</p>
            <p className="text-ink-muted text-xs">Consultá cierres anteriores.</p>
          </div>
          <ArrowRight size={18} color="#94A3B8" />
        </button>
      </div>

      <CashRegisterStatusCard caja={cashShift} totalHoy={todayTotal} />

      {cashShift?.estado !== "ABIERTA" && (
        <div className="space-y-1.5">
          <Button variant="secondary" fullWidth onClick={tocarAbrir} disabled={abriendo}>
            Abrir caja ahora (manual)
          </Button>
          {avisoFueraHorario && (
            <p className="text-xs text-center" style={{ color: COLORS.agotado }}>
              Solo se puede abrir manualmente entre 08:00 y 22:00.
            </p>
          )}
        </div>
      )}

      <Card>
        <p className="font-display font-semibold text-ink">Últimas ventas</p>
        {ultimasVentas.length === 0 ? (
          <p className="text-ink-subtle text-sm mt-3">Todavía no registraste ventas hoy.</p>
        ) : (
          <div className="divide-y divide-line-soft mt-2">
            {ultimasVentas.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">Venta #{v.id}</p>
                  <p className="text-xs text-ink-subtle">{formatDate(v.fecha ?? v.date ?? new Date())}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold text-ink">
                    {formatMoney(v.total ?? 0)}
                  </span>
                  <StatusBadge tone={(v.pago ?? v.paymentMethod) === "Efectivo" ? "success" : "info"}>
                    {v.pago ?? v.paymentMethod ?? "—"}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
