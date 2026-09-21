import { Header } from "../components/Header";
import { formatDate, formatMoney } from "../lib/format";
import type { MovementId } from "../types/domain";
import type { MovementRecordItem } from "./StockMovementsView";

export interface StockMovementDetailViewProps {
  movements?: MovementRecordItem[];
  movimientos?: MovementRecordItem[];
  movementId?: MovementId | null;
  movimientoId?: MovementId | null;
  pop: () => void;
}

export function StockMovementDetailView(props: StockMovementDetailViewProps) {
  const { pop } = props;
  const movimientos = props.movements ?? props.movimientos ?? [];
  const movimientoId = props.movementId ?? props.movimientoId;

  const m = movimientos.find((mv) => mv.id === movimientoId);
  if (!m) return null;

  const tipo = m.tipo ?? m.type;
  const producto = m.producto ?? m.productName ?? "";
  const cantidad = m.cantidad ?? m.quantity ?? 0;
  const unidad = m.unidad ?? m.unit ?? "unidad";
  const diferencia = m.diferencia ?? m.difference ?? 0;
  const motivo = m.motivo ?? m.reason ?? "";
  const total = m.total ?? 0;
  const pago = m.pago ?? m.paymentMethod ?? "";
  const items = m.items ?? [];

  return (
    <div>
      <Header title="Detalle del movimiento" onBack={pop} />
      <div className="px-5">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{formatDate(m.fecha)}</span>
          </div>

          {tipo === "venta" && (
            <>
              <div className="border-t border-stone-100 pt-3 space-y-1">
                {items.map((it) => {
                  const itNombre = it.nombre ?? it.name ?? "";
                  const itUnidad = it.unidad ?? it.unit ?? "unidad";
                  const itKey = `${it.productId ?? itNombre}-${it.cantidad}-${it.precio ?? ""}`;
                  return (
                    <div key={itKey} className="flex justify-between text-sm">
                      <span className="text-stone-600">
                        {itNombre} × {it.cantidad}
                        {itUnidad === "kg" ? "kg" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-bold">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Medio de pago</span>
                <span className="text-stone-800 font-medium">{pago}</span>
              </div>
            </>
          )}

          {tipo === "entrada" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad</span>
                <span className="text-stone-800 font-medium">
                  +{cantidad}
                  {unidad === "kg" ? "kg" : " un."}
                </span>
              </div>
            </>
          )}

          {tipo === "ajuste" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Diferencia</span>
                <span className="text-stone-800 font-medium">
                  {diferencia > 0 ? "+" : ""}
                  {diferencia}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Motivo</span>
                <span className="text-stone-800 font-medium">{motivo}</span>
              </div>
            </>
          )}
        </div>
        <p className="text-stone-400 text-xs text-center mt-4">
          Los movimientos son de solo lectura y no pueden editarse ni borrarse.
        </p>
      </div>
    </div>
  );
}
