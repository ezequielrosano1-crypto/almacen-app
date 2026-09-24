import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { listClosings } from "../data/closingsRepository";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import type { ClosingSummary } from "../types/domain";

export interface ClosingHistoryViewProps {
  pop: () => void;
}

export function ClosingHistoryView({ pop }: ClosingHistoryViewProps) {
  const [cargando, setCargando] = useState(true);
  const [cierres, setCierres] = useState<ClosingSummary[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        // Every CERRADA row of `jornada` is one closing (manual or automatic).
        const registros = await listClosings();
        if (activo) setCierres(registros);
      } catch (_e) {
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="px-5 space-y-3 pb-6">
      <Header title="Historial de cierres" onBack={pop} />
      {cargando ? (
        <p className="text-ink-subtle text-sm text-center py-6">Cargando historial...</p>
      ) : error ? (
        <p className="text-ink-subtle text-sm text-center py-6">No se pudo cargar el historial.</p>
      ) : cierres.length === 0 ? (
        <p className="text-ink-subtle text-sm text-center py-6">
          Todavía no hay ningún día cerrado.
        </p>
      ) : (
        <div className="space-y-2">
          {cierres.map((c) => (
            <div
              key={`${c.date}-${c.time}`}
              className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{c.date}</p>
                <span
                  className="text-xs font-medium"
                  style={{ color: c.isAutoClosed ? COLORS.bajo : COLORS.principal }}
                >
                  {c.isAutoClosed ? "Cierre automático" : "Cierre manual"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Hora de cierre</span>
                <span className="text-ink font-medium">{c.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Total</span>
                <span className="text-ink font-medium">{formatMoney(c.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Cantidad de ventas</span>
                <span className="text-ink font-medium">{c.salesCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
