import type { ReactElement } from "react";

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
export function FilterChips({ options, value, onChange }: FilterChipsProps): ReactElement {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={[
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
              isActive
                ? "bg-brand text-white border-brand"
                : "bg-white text-ink-soft border-line",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
