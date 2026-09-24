import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { Card } from "./Card";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

// Centered empty/placeholder state used for empty lists and "coming soon" screens.
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps): ReactElement {
  return (
    <Card className="flex flex-col items-center text-center py-10 px-6">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-brand-50">
        <Icon size={26} color="#0066FF" strokeWidth={2} />
      </div>
      <h2 className="font-display text-lg font-bold text-ink mt-4">{title}</h2>
      <p className="text-ink-muted mt-2 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
