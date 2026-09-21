import { Search } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Barra de búsqueda con icono y campo de texto estilizado.
export function SearchBar({ value, onChange, placeholder }: SearchBarProps): ReactElement {
  return (
    <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
      <Search size={18} color="#B8B2A5" />
      <input
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        className="flex-1 bg-transparent outline-none text-stone-700 text-sm"
      />
    </div>
  );
}
