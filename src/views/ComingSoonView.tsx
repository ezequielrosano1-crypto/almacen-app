import { BarChart3, ShoppingBag, Truck, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";

export type ComingSoonSection = "purchases" | "suppliers" | "reports";

interface SectionCopy {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  description: string;
}

const SECTION_COPY: Record<ComingSoonSection, SectionCopy> = {
  purchases: {
    title: "Compras",
    subtitle:
      "Gestioná tus compras, controlá tus proveedores y mantené tu stock siempre abastecido.",
    icon: ShoppingBag,
    description:
      "Vas a poder registrar órdenes de compra, seguir su estado y actualizar tu stock automáticamente al recibirlas.",
  },
  suppliers: {
    title: "Proveedores",
    subtitle:
      "Gestioná tus proveedores, seguí tus compras y mantené toda la información en un solo lugar.",
    icon: Truck,
    description:
      "Vas a poder cargar tus proveedores, ver su historial de compras y sus datos de contacto.",
  },
  reports: {
    title: "Reportes",
    subtitle: "Analizá el rendimiento de tu negocio con reportes claros y completos.",
    icon: BarChart3,
    description:
      "Vas a poder ver reportes de ventas, stock y caja para entender cómo evoluciona tu negocio.",
  },
};

export interface ComingSoonViewProps {
  section: ComingSoonSection;
}

// Placeholder screen for sections that appear in navigation but don't have a
// backend yet (Compras, Proveedores, Reportes) — honest "coming soon" state
// instead of faking data for widgets we can't support.
export function ComingSoonView({ section }: ComingSoonViewProps): ReactElement {
  const copy = SECTION_COPY[section];

  return (
    <div className="pb-4 space-y-5">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />
      <EmptyState
        icon={copy.icon}
        title="Próximamente"
        description={copy.description}
        action={<StatusBadge tone="info">En desarrollo</StatusBadge>}
      />
    </div>
  );
}
