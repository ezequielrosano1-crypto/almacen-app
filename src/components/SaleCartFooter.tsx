import { Minus, Plus, X } from "lucide-react";
import { formatMoney } from "../lib/format";
import type { PaymentMethod } from "../types/domain";
import { PrimaryButton } from "./PrimaryButton";

export interface SaleCartFooterItem<P = unknown> {
  id: number | string;
  cantidad?: number;
  quantity?: number;
  subtotal: number;
  producto?: P;
  nombre?: string;
  name?: string;
  unidad?: string;
  unit?: string;
}

export interface SaleCartFooterProps {
  items: SaleCartFooterItem[];
  total: number;
  pago?: PaymentMethod | string | null;
  paymentMethod?: PaymentMethod | string | null;
  setPago?: (pago: PaymentMethod | string) => void;
  setPaymentMethod?: (method: PaymentMethod) => void;
  confirmarVenta?: () => void;
  onConfirmar?: () => void;
  onConfirm?: () => void;
  enviando?: boolean;
  submitting?: boolean;
  cambiarCantidad?: (id: number | string, delta: number) => void;
  onCambiarCantidad?: (id: number | string, delta: number) => void;
  onChangeQuantity?: (id: number | string, delta: number) => void;
  quitarProducto?: (id: number | string) => void;
  onQuitarProducto?: (id: number | string) => void;
  onRemoveProduct?: (id: number | string) => void;
}

export function SaleCartFooter({
  items,
  total,
  pago,
  paymentMethod,
  setPago,
  setPaymentMethod,
  confirmarVenta,
  onConfirmar,
  onConfirm,
  enviando,
  submitting,
  cambiarCantidad,
  onCambiarCantidad,
  onChangeQuantity,
  quitarProducto,
  onQuitarProducto,
  onRemoveProduct,
}: SaleCartFooterProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const selectedPayment = paymentMethod ?? pago;
  const isSubmitting = submitting ?? enviando ?? false;
  const handleConfirm = onConfirm || onConfirmar || confirmarVenta;
  const handleChangeQty = onChangeQuantity || onCambiarCantidad || cambiarCantidad;
  const handleRemove = onRemoveProduct || onQuitarProducto || quitarProducto;

  const handleSelectPayment = (m: PaymentMethod) => {
    if (setPaymentMethod) {
      setPaymentMethod(m);
    } else if (setPago) {
      setPago(m);
    }
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-line max-w-sm mx-auto flex flex-col">
      {/* Zona con scroll propio: SOLO la lista de productos del carrito */}
      <div className="px-5 pt-3 space-y-2 max-h-40 overflow-y-auto">
        {items.map((it) => {
          const prod = it.producto as
            | { nombre?: string; name?: string; unidad?: string; unit?: string }
            | undefined;
          const name = prod?.nombre ?? prod?.name ?? it.nombre ?? it.name ?? "";
          const qty = it.cantidad ?? it.quantity ?? 0;
          const unit = prod?.unidad ?? prod?.unit ?? it.unidad ?? it.unit;

          return (
            <div key={it.id} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <p className="text-ink font-medium">{name}</p>
                <p className="text-ink-subtle text-xs">{formatMoney(it.subtotal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeQty?.(it.id, -1)}
                  className="p-1 bg-line-soft rounded-full"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center text-ink-soft">
                  {qty}
                  {unit === "kg" ? "kg" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleChangeQty?.(it.id, 1)}
                  className="p-1 bg-line-soft rounded-full"
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove?.(it.id)}
                  className="p-1 text-ink-subtle"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zona fija: Total, medio de pago y Confirmar venta — nunca dentro del scroll */}
      <div className="px-5 pt-2 pb-4 space-y-2 border-t border-line-soft bg-white">
        <div className="flex justify-between items-center">
          <span className="text-ink-muted text-sm">Total</span>
          <span className="text-xl font-display font-bold" style={{ color: "#0066FF" }}>
            {formatMoney(total)}
          </span>
        </div>

        <div className="flex gap-2">
          {(["Efectivo", "Débito"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => handleSelectPayment(m)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
              style={
                selectedPayment === m
                  ? { backgroundColor: "#0066FF", color: "#FFFFFF", borderColor: "#0066FF" }
                  : { backgroundColor: "#FFFFFF", color: "#374151", borderColor: "#E2E8F0" }
              }
            >
              {m}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <PrimaryButton onClick={handleConfirm} disabled={!selectedPayment || isSubmitting}>
            Confirmar venta
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
