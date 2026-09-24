import { Store } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { getInitials } from "../../lib/format";
import { DESKTOP_NAV_ITEMS } from "../../lib/navigation";
import type { TabId } from "../../types/navigation";
import { BottomNav } from "../BottomNav";
import { Logo } from "../Logo";

export interface AppShellProps {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  businessName: string;
  children: ReactNode;
}

// Responsive shell: fixed carbon sidebar + topbar on desktop (lg:+), carbon
// header + bottom tab bar on mobile. Screens render inside via `children`.
export function AppShell({ tab, onTabChange, businessName, children }: AppShellProps): ReactElement {
  const initials = getInitials(businessName);

  return (
    <div className="min-h-screen bg-canvas">
      <style>{`
        button { -webkit-tap-highlight-color: transparent; }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid #0066FF; outline-offset: 2px; }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col bg-carbon">
        <div className="px-6 pt-6 pb-8">
          <Logo variant="white" className="h-8" />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {DESKTOP_NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => onTabChange(key)}
                className={[
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-brand text-white" : "text-white/80 hover:bg-white/5",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Store size={18} color="#FFFFFF" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{businessName}</p>
              <p className="text-xs text-white/60 truncate">Negocio principal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden bg-carbon px-4 py-4 flex items-center">
        <Logo variant="white" className="h-6" />
      </header>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Desktop topbar */}
        <div className="hidden lg:flex items-center justify-end border-b border-line bg-white px-8 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-carbon text-xs font-semibold text-white">
            {initials}
          </div>
        </div>

        <main className="px-4 py-4 lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden">
        <BottomNav active={tab} onChange={onTabChange} />
      </div>
    </div>
  );
}
