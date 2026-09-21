import { formatMoney } from "../lib/format";
import type { PaymentMethod } from "../types/domain";

export interface ScannerCartItem {
  id: number | string;
  cantidad?: number;
  quantity?: number;
  subtotal: number;
  producto?: {
    nombre?: string;
    name?: string;
    unidad?: string;
    unit?: string;
  };
  nombre?: string;
  name?: string;
  unidad?: string;
  unit?: string;
}

export interface BarcodeScannerCartPanelProps {
  items: ScannerCartItem[];
  total: number;
  paymentMethod?: PaymentMethod | string | null;
  /** Alias legacy para compatibilidad con App.jsx */
  pago?: PaymentMethod | string | null;
  setPaymentMethod?: (method: PaymentMethod) => void;
  /** Alias legacy para compatibilidad con App.jsx */
  setPago?: (method: PaymentMethod | string) => void;
  onConfirm?: () => void;
  /** Alias legacy para compatibilidad con App.jsx */
  onConfirmar?: () => void;
  submitting?: boolean;
  /** Alias legacy para compatibilidad con App.jsx */
  enviando?: boolean;
}

export function BarcodeScannerCartPanel({
  items,
  total,
  paymentMethod,
  pago,
  setPaymentMethod,
  setPago,
  onConfirm,
  onConfirmar,
  submitting,
  enviando,
}: BarcodeScannerCartPanelProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const selectedPayment = paymentMethod ?? pago;
  const isSubmitting = submitting ?? enviando ?? false;
  const handleConfirm = onConfirm || onConfirmar;

  const handleSelectPayment = (m: PaymentMethod) => {
    if (setPaymentMethod) {
      setPaymentMethod(m);
    } else if (setPago) {
      setPago(m);
    }
  };

  return (
    <div
      className="px-5 pt-2 pb-4 space-y-2"
      style={{ backgroundColor: "#111111", maxHeight: "45vh", overflowY: "auto" }}
    >
      <p className="text-[10px] uppercase tracking-wide text-stone-400 pb-0.5">
        Agregado en esta venta
      </p>
      <div className="space-y-1">
        {items.map((it) => {
          const name = it.producto?.nombre ?? it.producto?.name ?? it.nombre ?? it.name ?? "";
          const qty = it.cantidad ?? it.quantity ?? 0;
          const unit = it.producto?.unidad ?? it.producto?.unit ?? it.unidad ?? it.unit;

          return (
            <div key={it.id} className="flex items-center justify-between text-xs text-white">
              <span className="truncate pr-2">
                {name} × {qty}
                {unit === "kg" ? "kg" : ""}
              </span>
              <span className="shrink-0">{formatMoney(it.subtotal)}</span>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between text-sm font-semibold pt-2"
        style={{ color: "#FFFFFF", borderTop: "1px solid #FFFFFF33" }}
      >
        <span>Total</span>
        <span>{formatMoney(total || 0)}</span>
      </div>

      <div className="flex gap-2 pt-1">
        {(["Efectivo", "Débito"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => handleSelectPayment(m)}
            className="flex-1 rounded-xl py-2 text-sm font-semibold border"
            style={
              selectedPayment === m
                ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                : { backgroundColor: "transparent", color: "#FFFFFF", borderColor: "#FFFFFF55" }
            }
          >
            {m}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selectedPayment || isSubmitting}
        className="w-full appearance-none font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2"
        style={
          !selectedPayment || isSubmitting
            ? { backgroundColor: "#3A3A3A", color: "#8A8A8A" }
            : { backgroundColor: "#2E6B4F", color: "#FFFFFF" }
        }
      >
        Confirmar venta
      </button>
    </div>
  );
}
