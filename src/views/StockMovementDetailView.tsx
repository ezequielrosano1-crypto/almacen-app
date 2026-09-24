import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { formatDate, formatMoney } from "../lib/format";
import type { MovementId, MovementRecordItem } from "../types/domain";

export interface StockMovementDetailViewProps {
  movements?: MovementRecordItem[];
  movementId?: MovementId | null;
  pop: () => void;
}

export function StockMovementDetailView(props: StockMovementDetailViewProps) {
  const { pop } = props;
  const movimientos = props.movements ?? [];
  const movimientoId = props.movementId;

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
    <div className="pb-4 lg:max-w-2xl">
      <PageHeader title="Detalle del movimiento" onBack={pop} />
      <Card className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Fecha</span>
          <span className="text-ink font-medium">{formatDate(m.fecha)}</span>
        </div>

        {tipo === "venta" && (
          <>
            <div className="border-t border-line-soft pt-3 space-y-1">
              {items.map((it) => {
                const itNombre = it.nombre ?? it.name ?? "";
                const itUnidad = it.unidad ?? it.unit ?? "unidad";
                const itKey = `${it.productId ?? itNombre}-${it.cantidad}-${it.precio ?? ""}`;
                return (
                  <div key={itKey} className="flex justify-between text-sm">
                    <span className="text-ink-soft">
                      {itNombre} × {it.cantidad}
                      {itUnidad === "kg" ? "kg" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-sm border-t border-line-soft pt-3">
              <span className="text-ink-muted">Total</span>
              <span className="font-display font-bold text-ink">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Medio de pago</span>
              <span className="text-ink font-medium">{pago}</span>
            </div>
          </>
        )}

        {tipo === "entrada" && (
          <>
            <div className="flex justify-between text-sm border-t border-line-soft pt-3">
              <span className="text-ink-muted">Producto</span>
              <span className="text-ink font-medium">{producto}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Cantidad</span>
              <span className="text-ink font-medium">
                +{cantidad}
                {unidad === "kg" ? "kg" : " un."}
              </span>
            </div>
          </>
        )}

        {tipo === "ajuste" && (
          <>
            <div className="flex justify-between text-sm border-t border-line-soft pt-3">
              <span className="text-ink-muted">Producto</span>
              <span className="text-ink font-medium">{producto}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Diferencia</span>
              <span className="text-ink font-medium">
                {diferencia > 0 ? "+" : ""}
                {diferencia}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Motivo</span>
              <span className="text-ink font-medium">{motivo}</span>
            </div>
          </>
        )}
      </Card>
      <p className="text-ink-subtle text-xs text-center mt-4">
        Los movimientos son de solo lectura y no pueden editarse ni borrarse.
      </p>
    </div>
  );
}
