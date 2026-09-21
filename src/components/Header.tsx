import { ArrowLeft } from "lucide-react";
import type { ReactElement } from "react";

export interface HeaderProps {
  title: string;
  onBack?: () => void;
}

// Encabezado estándar para pantallas con título y botón opcional de retroceso.
export function Header({ title, onBack }: HeaderProps): ReactElement {
  return (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      {onBack && (
        <button type="button" onClick={onBack} className="p-1 -ml-1">
          <ArrowLeft size={22} color="#57534E" />
        </button>
      )}
      <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
    </div>
  );
}
