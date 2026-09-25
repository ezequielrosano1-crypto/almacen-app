import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

// Centered empty/placeholder state used for empty lists and "coming soon" screens.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps): ReactElement {
  return (
    <Empty className={cn("rounded-2xl border-0 bg-white shadow-border p-6 py-10 px-6")}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="h-14 w-14 rounded-full bg-brand-50">
          <Icon size={26} className="text-brand" strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle className="font-display text-lg font-bold text-ink">{title}</EmptyTitle>
        <EmptyDescription className="text-sm text-ink-muted max-w-sm">{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent className="mt-1">{action}</EmptyContent>}
    </Empty>
  );
}
