import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
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
        <div className="space-y-2" role="status" aria-label="Cargando historial">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
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
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-ink-muted">Fecha</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted">Hora de cierre</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted text-right">Total</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted text-right">Ventas</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres.map((c) => (
                  <TableRow key={`${c.date}-${c.time}`} className="border-line-soft">
                    <TableCell className="px-4 py-3 font-medium text-ink">{c.date}</TableCell>
                    <TableCell className="px-4 py-3 text-ink-soft">{c.time}</TableCell>
                    <TableCell className="px-4 py-3 text-ink text-right tabular-nums">
                      {formatMoney(c.total)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-ink text-right tabular-nums">
                      {c.salesCount}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge tone={c.isAutoClosed ? "warning" : "info"}>
                        {c.isAutoClosed ? "Automático" : "Manual"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
