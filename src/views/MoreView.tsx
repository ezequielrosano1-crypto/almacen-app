import { BarChart3, ChevronRight, Settings, Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import type { ScreenId, ScreenParams, TabId } from "../types/navigation";

export interface MoreViewProps {
  push: (screen: ScreenId, params?: ScreenParams) => void;
  goTab: (tab: TabId) => void;
}

interface HubEntry {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  comingSoon?: boolean;
}

// Hub screen for the "more" tab. On mobile it's what the bottom bar's "Más"
// button opens; on desktop it's the "Configuración" section (same tab). It
// gathers everything that doesn't have its own top-level slot: the
// not-yet-built Proveedores/Reportes sections plus the existing settings rows.
export function MoreView({ push, goTab }: MoreViewProps) {
  const entries: HubEntry[] = [
    {
      key: "business",
      label: "Negocio",
      description: "Nombre y contacto de tu almacén.",
      icon: Store,
      onClick: () => push("businessInfo"),
    },
    {
      key: "settings",
      label: "Preferencias",
      description: "Ajustes y herramientas de la app.",
      icon: Settings,
      onClick: () => push("settings"),
    },
    {
      key: "suppliers",
      label: "Proveedores",
      description: "Gestioná tus proveedores.",
      icon: Truck,
      onClick: () => goTab("suppliers"),
      comingSoon: true,
    },
    {
      key: "reports",
      label: "Reportes",
      description: "Analizá el rendimiento de tu negocio.",
      icon: BarChart3,
      onClick: () => goTab("reports"),
      comingSoon: true,
    },
  ];

  return (
    <div className="pb-4 space-y-5">
      <PageHeader
        title="Configuración"
        subtitle="Personalizá tu negocio, usuarios y preferencias del sistema."
      />

      {/* Desktop card grid */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-3">
        {entries.map((e) => (
          <Card
            key={e.key}
            role="button"
            tabIndex={e.comingSoon ? -1 : 0}
            aria-disabled={e.comingSoon}
            onClick={e.comingSoon ? undefined : e.onClick}
            onKeyDown={(ev) => {
              if (!e.comingSoon && (ev.key === "Enter" || ev.key === " ")) {
                ev.preventDefault();
                e.onClick();
              }
            }}
            className={[
              "flex flex-col items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              e.comingSoon ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <e.icon size={18} className="text-brand" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="font-medium text-ink">{e.label}</p>
            <p className="text-xs text-ink-muted">{e.description}</p>
            {e.comingSoon && <StatusBadge tone="info">Próximamente</StatusBadge>}
          </Card>
        ))}
      </div>

      {/* Mobile row list */}
      <div className="lg:hidden space-y-2">
        {entries.map((e) => (
          <Card
            key={e.key}
            role="button"
            tabIndex={e.comingSoon ? -1 : 0}
            aria-disabled={e.comingSoon}
            onClick={e.comingSoon ? undefined : e.onClick}
            onKeyDown={(ev) => {
              if (!e.comingSoon && (ev.key === "Enter" || ev.key === " ")) {
                ev.preventDefault();
                e.onClick();
              }
            }}
            className={[
              "w-full flex items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              e.comingSoon ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50">
              <e.icon size={16} className="text-brand" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="flex-1 text-ink-soft font-medium">{e.label}</span>
            {e.comingSoon ? (
              <StatusBadge tone="info">Próximamente</StatusBadge>
            ) : (
              <ChevronRight size={20} className="text-ink-subtle" aria-hidden="true" />
            )}
          </Card>
        ))}
      </div>

      {/* Desktop business info summary */}
      <Card className="hidden lg:block">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold text-ink">Información del negocio</p>
          <Button variant="ghost" size="sm" onClick={() => push("businessInfo")} className="text-brand">
            Editar
          </Button>
        </div>
        <p className="text-ink-muted text-sm mt-2">
          Gestioná el nombre y el contacto que ven tus clientes y comprobantes.
        </p>
      </Card>
    </div>
  );
}
