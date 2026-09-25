import type { ReactElement } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

// Horizontal scrollable pill filter, active chip in solid brand color.
// Built on shadcn ToggleGroup (type="single") for roving-tabindex arrow-key
// navigation; an empty selection is rejected so a chip always stays active.
export function FilterChips({ options, value, onChange }: FilterChipsProps): ReactElement {
  return (
    <ToggleGroup
      type="single"
      spacing={2}
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className="flex gap-2 overflow-x-auto no-scrollbar w-full justify-start"
    >
      {options.map((option) => {
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full h-9 pointer-coarse:h-11 px-4 text-sm font-semibold border transition-[color,background-color,border-color,box-shadow] duration-150 ease-out data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:border-brand data-[state=off]:bg-white data-[state=off]:text-ink-soft data-[state=off]:border-line data-[state=off]:shadow-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          >
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
