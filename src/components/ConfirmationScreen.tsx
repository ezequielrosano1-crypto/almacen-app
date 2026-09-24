import type { ReactElement, ReactNode } from "react";
import { Button } from "./ui/Button";

export interface ConfirmationScreenProps {
  icon: ReactNode;
  title: string;
  message: string;
  buttonLabel: string;
  onDone: () => void;
}

// Pantalla de confirmación con icono, mensaje y botón primario.
export function ConfirmationScreen({
  icon,
  title,
  message,
  buttonLabel,
  onDone,
}: ConfirmationScreenProps): ReactElement {
  return (
    <div className="pt-16 pb-4 flex flex-col items-center text-center lg:max-w-sm lg:mx-auto">
      {icon}
      <h2 className="font-display text-xl font-bold text-ink mt-4">{title}</h2>
      <p className="text-ink-muted text-sm mt-2">{message}</p>
      <div className="w-full mt-8">
        <Button fullWidth onClick={onDone}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
