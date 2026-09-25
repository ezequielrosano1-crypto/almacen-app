import { Search } from "lucide-react";
import type { ChangeEvent, ReactElement } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Barra de búsqueda con icono y campo de texto estilizado.
export function SearchBar({ value, onChange, placeholder }: SearchBarProps): ReactElement {
  const label = placeholder || "Buscar...";

  return (
    <InputGroup className="h-10 pointer-coarse:h-11 rounded-2xl bg-white shadow-border border-transparent px-1 has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 has-[[data-slot=input-group-control]:focus-visible]:ring-offset-background">
      <InputGroupAddon>
        <Search size={18} className="text-ink-subtle" strokeWidth={1.5} />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        type="search"
        inputMode="search"
        className="text-ink-soft text-sm"
      />
    </InputGroup>
  );
}
