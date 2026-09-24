import type { HTMLAttributes, ReactElement } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

// White rounded surface used across the STOCKIA layout for grouped content.
export function Card({
  children,
  className,
  padded = true,
  ...rest
}: CardProps): ReactElement {
  return (
    <div
      className={[
        "rounded-2xl border border-line bg-white shadow-sm",
        padded ? "p-4" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
