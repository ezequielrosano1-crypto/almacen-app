import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success-50 text-success",
  warning: "bg-warning-50 text-warning",
  danger: "bg-danger-50 text-danger",
  info: "bg-brand-50 text-brand",
  neutral: "bg-line-soft text-ink-muted",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-brand",
  neutral: "bg-ink-subtle",
};

// Small pill badge with a colored dot, used for statuses across the app.
// Status is never conveyed by color alone: the label text is always present
// (better-accessibility "Don't rely on color alone").
export function StatusBadge({ tone, children }: StatusBadgeProps): ReactElement {
  return (
    <Badge
      variant="secondary"
      className={cn("h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", TONE_CLASSES[tone])}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </Badge>
  );
}
