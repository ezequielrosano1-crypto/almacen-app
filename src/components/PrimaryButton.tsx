import type { MouseEvent, ReactElement, ReactNode } from "react";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

// Botón primario de acción completa en el azul eléctrico de la marca STOCKIA.
export function PrimaryButton({ children, onClick, disabled }: PrimaryButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full appearance-none font-display font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
      style={
        disabled
          ? { backgroundColor: "#E2E8F0", color: "#64748B", cursor: "not-allowed" }
          : { backgroundColor: "#0066FF", color: "#FFFFFF" }
      }
    >
      {children}
    </button>
  );
}
