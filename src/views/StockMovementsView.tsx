import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Header } from "../components/Header";
import { COLORS } from "../lib/constants";
import { formatDate, formatMoney } from "../lib/format";
import type { MovementId, MovementRecordItem } from "../types/domain";

export interface StockMovementsViewProps {
  movements?: MovementRecordItem[];
  onOpenDetail?: (id: MovementId) => void;
}

export function StockMovementsView(props: StockMovementsViewProps) {
  const movimientos = props.movements ?? [];
  const onOpenDetalle = props.onOpenDetail ?? (() => {});

  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", "Ventas", "Entradas", "Ajustes"];

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

  const colorTipo = (tipo?: string) =>
    tipo === "venta" ? COLORS.principal : tipo === "entrada" ? "#4DA3FF" : COLORS.bajo;

  return (
    <div>
      <Header title="Movimientos" />
      <div className="px-5 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {filtros.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFiltro(f)}
              className="whitespace-nowrap text-sm rounded-full px-3.5 py-1.5 border"
              style={
                filtro === f
                  ? { backgroundColor: "#0066FF", color: "#FFFFFF", borderColor: "#0066FF" }
                  : { backgroundColor: "#FFFFFF", color: "#374151", borderColor: "#E2E8F0" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {lista.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-6 text-center text-ink-subtle text-sm">
              Todavía no hay movimientos registrados
            </div>
          )}
          {lista.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onOpenDetalle(m.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorTipo(m.tipo ?? m.type) }}
                />
                <div>
                  <p className="text-ink font-medium text-sm">{resumenMovimiento(m)}</p>
                  <p className="text-ink-subtle text-xs">{formatDate(m.fecha)}</p>
                </div>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
