import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Card } from "./Card";

export interface KpiDelta {
  value: string;
  trend: "up" | "down";
}

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  delta?: KpiDelta;
}

// Metric card: icon, label, big value, optional trend delta and hint text.
export function KpiCard({ icon: Icon, label, value, hint, delta }: KpiCardProps): ReactElement {
  const DeltaIcon = delta?.trend === "down" ? ArrowDown : ArrowUp;
  const deltaColor = delta?.trend === "down" ? "text-danger" : "text-success";

  return (
    <Card>
      <Icon size={20} color="#1F2937" strokeWidth={2} />
      <p className="text-sm text-ink-muted mt-3">{label}</p>
      <p className="font-display text-2xl font-bold text-ink mt-1">{value}</p>
      {(delta || hint) && (
        <div className="flex items-center gap-2 mt-2">
          {delta && (
            <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${deltaColor}`}>
              <DeltaIcon size={14} strokeWidth={2.5} />
              {delta.value}
            </span>
          )}
          {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
