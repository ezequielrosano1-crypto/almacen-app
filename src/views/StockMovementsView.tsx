import { ArrowRightLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FilterChips } from "../components/common/FilterChips";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { formatDate, formatMoney } from "../lib/format";
import type { MovementId, MovementRecordItem } from "../types/domain";

export interface StockMovementsViewProps {
  movements?: MovementRecordItem[];
  onOpenDetail?: (id: MovementId) => void;
}

const FILTER_OPTIONS = [
  { value: "Todos", label: "Todos" },
  { value: "Ventas", label: "Ventas" },
  { value: "Entradas", label: "Entradas" },
  { value: "Ajustes", label: "Ajustes" },
];

const TIPO_TONE = {
  venta: "info",
  entrada: "success",
  ajuste: "warning",
} as const;

export function StockMovementsView(props: StockMovementsViewProps) {
  const movimientos = props.movements ?? [];
  const onOpenDetalle = props.onOpenDetail ?? (() => {});

  const [filtro, setFiltro] = useState("Todos");

  const lista = movimientos.filter((m) => {
    const tipo = m.tipo ?? m.type;
    if (filtro === "Todos") return true;
    if (filtro === "Ventas") return tipo === "venta";
    if (filtro === "Entradas") return tipo === "entrada";
    if (filtro === "Ajustes") return tipo === "ajuste";
    return false;
  });

  const resumenMovimiento = (m: MovementRecordItem) => {
    const tipo = m.tipo ?? m.type;
    const producto = m.producto ?? m.productName ?? "";
    if (tipo === "venta") return `Venta · ${formatMoney(m.total ?? 0)}`;
    if (tipo === "entrada") return `Entrada · ${producto}`;
    return `Ajuste · ${producto}`;
  };

  const tipoLabel = (tipo?: string) =>
    tipo === "venta" ? "Venta" : tipo === "entrada" ? "Entrada" : "Ajuste";

  return (
    <div className="pb-4 space-y-3">
      <PageHeader title="Movimientos" />
      <FilterChips options={FILTER_OPTIONS} value={filtro} onChange={setFiltro} />

      {lista.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="Todavía no hay movimientos registrados"
          description="Las ventas, entradas y ajustes de stock van a aparecer acá."
        />
      ) : (
        <div className="space-y-2">
          {lista.map((m) => {
            const tipo = m.tipo ?? m.type;
            return (
              <Card
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenDetalle(m.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenDetalle(m.id);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div>
                  <p className="text-ink font-medium text-sm">{resumenMovimiento(m)}</p>
                  <p className="text-ink-subtle text-xs mt-0.5">{formatDate(m.fecha)}</p>
                  <div className="mt-1.5">
                    <StatusBadge tone={tipo ? TIPO_TONE[tipo as keyof typeof TIPO_TONE] ?? "neutral" : "neutral"}>
                      {tipoLabel(tipo)}
                    </StatusBadge>
                  </div>
                </div>
                <ChevronRight size={18} className="text-ink-subtle" aria-hidden="true" />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
