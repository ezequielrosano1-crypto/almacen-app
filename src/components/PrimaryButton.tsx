import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Button } from "./common/Button";

export interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

// Full-width primary action button in the STOCKIA brand blue.
// Kept as a thin wrapper over the shared Button primitive for existing callers.
export function PrimaryButton({ children, onClick, disabled }: PrimaryButtonProps): ReactElement {
  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl shadow-xs"
    >
      {children}
    </Button>
  );
}
