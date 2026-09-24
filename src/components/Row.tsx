import { ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

export interface RowProps {
  label: string;
  onClick: () => void;
}

// Fila de navegación con etiqueta y flecha chevron derecha.
export function Row({ label, onClick }: RowProps): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-4 shadow-sm text-left"
    >
      <span className="text-ink-soft font-medium">{label}</span>
      <ChevronRight size={20} color="#94A3B8" />
    </button>
  );
}
