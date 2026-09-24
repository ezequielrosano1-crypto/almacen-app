import type { ReactElement } from "react";
import { MOBILE_NAV_ITEMS } from "../lib/navigation";
import type { TabId } from "../types/navigation";

export interface BottomNavProps {
  active: TabId | string;
  onChange: (tab: TabId) => void;
}

// Barra de navegación inferior fija para cambiar entre las 5 pestañas móviles.
export function BottomNav({ active, onChange }: BottomNavProps): ReactElement {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-line flex justify-around items-center px-1 pt-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {MOBILE_NAV_ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            type="button"
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className="flex items-center justify-center rounded-full px-3 py-1 transition-colors"
              style={{ backgroundColor: isActive ? "#0066FF" : "transparent" }}
            >
              <Icon size={22} strokeWidth={2} color={isActive ? "#FFFFFF" : "#64748B"} />
            </div>
            <span
              className={`text-xs mt-1 ${isActive ? "font-semibold" : ""}`}
              style={{ color: isActive ? "#0066FF" : "#94A3B8" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
