import type { HTMLAttributes, MouseEventHandler, ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Card as ShadcnCard } from "@/components/ui/card";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

// White rounded surface used across the STOCKIA layout for grouped content.
// Uses the layered shadow-as-border token instead of border+shadow
// (better-ui/surfaces.md); clickable cards (onClick or role="button") get the
// hover elevation step.
export function Card({ children, className, padded = true, onClick, role, ...rest }: CardProps): ReactElement {
  const isClickable = Boolean(onClick) || role === "button";

  return (
    <ShadcnCard
      className={cn(
        // Reset Mira's built-in card gap/padding/text-xs so each view's own spacing and type scale apply.
        "gap-0 py-0 text-base leading-normal rounded-2xl bg-white shadow-border ring-0",
        isClickable && "hover:shadow-border-hover transition-[box-shadow] duration-150 ease-out",
        padded ? "p-4" : "",
        className
      )}
      onClick={onClick as MouseEventHandler<HTMLDivElement> | undefined}
      role={role}
      {...rest}
    >
      {children}
    </ShadcnCard>
  );
}
