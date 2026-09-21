import type { ReactElement } from "react";
import { getStatusColor } from "../lib/stock";
import type { ProductStatus } from "../types/domain";

export interface StatusDotProps {
  estado?: ProductStatus | string;
}

// Indicador circular de color según el estado del producto (normal, bajo, agotado).
export function StatusDot({ estado = "" }: StatusDotProps): ReactElement {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{ backgroundColor: getStatusColor(estado) }}
    />
  );
}
