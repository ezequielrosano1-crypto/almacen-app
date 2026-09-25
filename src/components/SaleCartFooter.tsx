import { Minus, Plus, X } from "lucide-react";
import { formatMoney } from "../lib/format";
import type { PaymentMethod } from "../types/domain";
import { Button } from "./common/Button";
import { PrimaryButton } from "./PrimaryButton";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

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
                <Button
                  variant="ghost"
                  size="sm"
                  static
                  onClick={() => handleChangeQty?.(it.id, -1)}
                  aria-label={`Restar unidad de ${name}`}
                  className="h-8 w-8 p-0 rounded-full bg-line-soft"
                >
                  <Minus size={14} strokeWidth={2} aria-hidden="true" />
                </Button>
                <span className="w-10 text-center text-ink-soft tabular-nums">
                  {qty}
                  {unit === "kg" ? "kg" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  static
                  onClick={() => handleChangeQty?.(it.id, 1)}
                  aria-label={`Sumar unidad de ${name}`}
                  className="h-8 w-8 p-0 rounded-full bg-line-soft"
                >
                  <Plus size={14} strokeWidth={2} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  static
                  onClick={() => handleRemove?.(it.id)}
                  aria-label={`Quitar ${name} de la venta`}
                  className="h-8 w-8 p-0 text-ink-subtle"
                >
                  <X size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
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

        <ToggleGroup
          type="single"
          spacing={2}
          value={selectedPayment ?? ""}
          onValueChange={(next) => {
            if (next) handleSelectPayment(next as PaymentMethod);
          }}
          aria-label="Método de pago"
          className="flex w-full gap-2"
        >
          {(["Efectivo", "Débito"] as const).map((m) => (
            <ToggleGroupItem
              key={m}
              value={m}
              className="flex-1 h-10 pointer-coarse:h-11 rounded-xl text-sm font-semibold border border-line data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:border-brand data-[state=off]:bg-white data-[state=off]:text-ink-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {m}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="pt-1">
          <PrimaryButton onClick={handleConfirm} disabled={!selectedPayment || isSubmitting}>
            Confirmar venta
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
