import { AlertTriangle, Plus, XCircle } from "lucide-react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { Logo } from "../components/Logo";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import type { ScreenId, TabId } from "../types/navigation";
import type { StoredCashShift } from "../types/storage";

export interface HomeViewProps {
  todayTotal?: number;
  todayCashTotal?: number;
  todayDebitTotal?: number;
  todayProductsSold?: number;
  lowStockProducts?: unknown[];
  outOfStockProducts?: unknown[];
  goTabScreen: (tab: TabId, screen: ScreenId) => void;
  cashShift?: StoredCashShift | null;
}

export function HomeView(props: HomeViewProps) {
  const total = props.todayTotal ?? 0;
  const cashTotal = props.todayCashTotal ?? 0;
  const debitTotal = props.todayDebitTotal ?? 0;
  const productsSold = props.todayProductsSold ?? 0;
  const lowStock = props.lowStockProducts ?? [];
  const outOfStock = props.outOfStockProducts ?? [];
  const cashShift = props.cashShift ?? null;
  const goTabScreen = props.goTabScreen;

  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <Logo className="h-7" />
      <div>
        <p className="text-ink-muted text-sm">Hoy</p>
        <h1 className="text-2xl font-bold text-ink">Resumen del día</h1>
      </div>

      <CashRegisterStatusCard caja={cashShift} totalHoy={total} />

      <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
        <p className="text-ink-muted text-sm mb-1">Ventas de hoy</p>
        <p className="text-4xl font-display font-bold mb-4" style={{ color: "#0066FF" }}>
          {formatMoney(total)}
        </p>
        <div className="flex justify-between text-sm text-ink-soft border-t border-line-soft pt-3">
          <span>
            Efectivo: <strong className="text-ink">{formatMoney(cashTotal)}</strong>
          </span>
          <span>
            Débito: <strong className="text-ink">{formatMoney(debitTotal)}</strong>
          </span>
        </div>
        <p className="text-sm text-ink-muted mt-2">{productsSold} productos vendidos</p>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          {outOfStock.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "lowStock")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <XCircle size={22} color={COLORS.agotado} />
              <span className="text-ink-soft text-sm">
                <strong style={{ color: COLORS.agotado }}>{outOfStock.length}</strong> productos
                agotados
              </span>
            </button>
          )}
          {lowStock.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "lowStock")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <AlertTriangle size={22} color={COLORS.bajo} />
              <span className="text-ink-soft text-sm">
                <strong style={{ color: COLORS.bajo }}>{lowStock.length}</strong> productos con
                stock bajo
              </span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => goTabScreen("sales", "newSale")}
          className="w-full font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: "#0066FF", color: "#FFFFFF" }}
        >
          <Plus size={22} />
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => goTabScreen("stock", "addStockEntry")}
          className="w-full font-semibold rounded-2xl py-3.5 text-base shadow-sm border flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF", color: "#0066FF", borderColor: "#0066FF33" }}
        >
          <Plus size={20} />
          Agregar entrada
        </button>
      </div>
    </div>
  );
}
