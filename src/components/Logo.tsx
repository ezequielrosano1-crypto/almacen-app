import type { ReactElement } from "react";

export interface LogoProps {
  variant?: "color" | "white";
  mark?: "full" | "icon";
  className?: string;
}

const SOURCES: Record<"color" | "white", Record<"full" | "icon", string>> = {
  color: { full: "/brand/logo.png", icon: "/brand/isotipo.png" },
  white: { full: "/brand/logo-white.png", icon: "/brand/isotipo-white.png" },
};

// STOCKIA brand logo/isotype, in color or negative (white) variants.
export function Logo({ variant = "color", mark = "full", className }: LogoProps): ReactElement {
  return <img src={SOURCES[variant][mark]} alt="STOCKIA" className={className ?? "h-7"} />;
}
