import { AlertTriangle, Plus, XCircle } from "lucide-react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
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
      <div>
        <p className="text-stone-500 text-sm">Hoy</p>
        <h1 className="text-2xl font-bold text-stone-800">Resumen del día</h1>
      </div>

      <CashRegisterStatusCard caja={cashShift} totalHoy={total} />

      <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
        <p className="text-stone-500 text-sm mb-1">Ventas de hoy</p>
        <p className="text-4xl font-bold mb-4" style={{ color: "#2E6B4F" }}>
          {formatMoney(total)}
        </p>
        <div className="flex justify-between text-sm text-stone-600 border-t border-stone-100 pt-3">
          <span>
            Efectivo: <strong className="text-stone-800">{formatMoney(cashTotal)}</strong>
          </span>
          <span>
            Débito: <strong className="text-stone-800">{formatMoney(debitTotal)}</strong>
          </span>
        </div>
        <p className="text-sm text-stone-500 mt-2">{productsSold} productos vendidos</p>
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
              <span className="text-stone-700 text-sm">
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
              <span className="text-stone-700 text-sm">
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
          style={{ backgroundColor: "#2E6B4F", color: "#FFFFFF" }}
        >
          <Plus size={22} />
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => goTabScreen("stock", "addStockEntry")}
          className="w-full font-semibold rounded-2xl py-3.5 text-base shadow-sm border flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
        >
          <Plus size={20} />
          Agregar entrada
        </button>
      </div>
    </div>
  );
}
