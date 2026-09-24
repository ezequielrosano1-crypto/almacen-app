import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { listClosings } from "../data/closingsRepository";
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
    <div className="pb-6 space-y-3">
      <PageHeader title="Historial de cierres" onBack={pop} />
      {cargando ? (
        <p className="text-ink-subtle text-sm text-center py-6">Cargando historial...</p>
      ) : error ? (
        <p className="text-ink-subtle text-sm text-center py-6">No se pudo cargar el historial.</p>
      ) : cierres.length === 0 ? (
        <EmptyState
          icon={History}
          title="Todavía no hay ningún día cerrado"
          description="Cuando cierres una jornada, va a aparecer acá."
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card padded={false} className="hidden lg:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-line">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Hora de cierre</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Ventas</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {cierres.map((c) => (
                  <tr key={`${c.date}-${c.time}`} className="border-b border-line-soft last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{c.date}</td>
                    <td className="px-4 py-3 text-ink-soft">{c.time}</td>
                    <td className="px-4 py-3 text-ink">{formatMoney(c.total)}</td>
                    <td className="px-4 py-3 text-ink">{c.salesCount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={c.isAutoClosed ? "warning" : "info"}>
                        {c.isAutoClosed ? "Automático" : "Manual"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {cierres.map((c) => (
              <Card key={`${c.date}-${c.time}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{c.date}</p>
                  <StatusBadge tone={c.isAutoClosed ? "warning" : "info"}>
                    {c.isAutoClosed ? "Cierre automático" : "Cierre manual"}
                  </StatusBadge>
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
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
