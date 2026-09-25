import { ArrowLeft } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className={cn(
              "-ml-2 mt-0.5 shrink-0 inline-flex h-10 w-10 pointer-coarse:h-11 pointer-coarse:w-11 items-center justify-center rounded-full",
              "transition-[color,background-color] duration-150 ease-out hover:bg-line-soft",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            )}
          >
            <ArrowLeft size={22} className="text-ink-soft" strokeWidth={2} />
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
