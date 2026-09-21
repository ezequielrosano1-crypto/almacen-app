import type { MouseEvent, ReactElement, ReactNode } from "react";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

// Botón primario de acción completa en color verde de la aplicación.
export function PrimaryButton({ children, onClick, disabled }: PrimaryButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full appearance-none font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
      style={
        disabled
          ? { backgroundColor: "#E7E5E4", color: "#78716C", cursor: "not-allowed" }
          : { backgroundColor: "#2E6B4F", color: "#FFFFFF" }
      }
    >
      {children}
    </button>
  );
}
