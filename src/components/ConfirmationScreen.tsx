import type { ReactElement, ReactNode } from "react";
import { PrimaryButton } from "./PrimaryButton";

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
    <div className="px-5 pt-16 pb-4 flex flex-col items-center text-center">
      {icon}
      <h2 className="text-xl font-bold text-stone-800 mt-4">{title}</h2>
      <p className="text-stone-500 text-sm mt-2">{message}</p>
      <div className="w-full mt-8">
        <PrimaryButton onClick={onDone}>{buttonLabel}</PrimaryButton>
      </div>
    </div>
  );
}
