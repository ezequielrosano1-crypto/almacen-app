import { ArrowLeft } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}

// Section header: big display title + optional subtitle, back button and a
// right-aligned action slot (stacked below the title on mobile).
export function PageHeader({ title, subtitle, action, onBack }: PageHeaderProps): ReactElement {
  return (
    <div className="pt-2 lg:pt-0 pb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex items-start gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="p-1 -ml-1 mt-1 shrink-0">
            <ArrowLeft size={22} color="#374151" />
          </button>
        )}
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
