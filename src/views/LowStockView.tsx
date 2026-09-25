import { ChevronRight, PackageX } from "lucide-react";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { formatStock, getProductStatus, getStatusTone } from "../lib/stock";
import type { ProductId } from "../types/domain";

export interface LowStockProductItem {
  id: ProductId;
  nombre?: string;
  name?: string;
  stock: number;
  stockMinimo?: number;
  minimumStock?: number;
  unidad?: string;
  unit?: string;
}

export interface LowStockViewProps {
  outOfStockProducts?: LowStockProductItem[];
  lowStockProducts?: LowStockProductItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
}

const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  bajo: "Stock bajo",
  agotado: "Agotado",
};

export function LowStockView(props: LowStockViewProps) {
  const { pop } = props;
  const productosAgotados = props.outOfStockProducts ?? [];
  const productosBajo = props.lowStockProducts ?? [];
  const onOpenDetalle = props.onOpenDetail ?? (() => {});

  const lista = [...productosAgotados, ...productosBajo];

  return (
    <div className="pb-4 space-y-2">
      <PageHeader title="Stock bajo" onBack={pop} />
      {lista.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="No hay productos para revisar"
          description="Cuando un producto quede con stock bajo o se agote, va a aparecer acá."
        />
      ) : (
        lista.map((p) => {
          const estado = getProductStatus(p);
          const nombre = p.nombre ?? p.name ?? "";

          return (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetalle(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenDetalle(p.id);
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div>
                <p className="text-ink font-medium text-sm">{nombre}</p>
                <p className="text-ink-subtle text-xs mt-0.5">Actual: {formatStock(p)}</p>
                <div className="mt-1.5">
                  <StatusBadge tone={getStatusTone(estado)}>{STATUS_LABEL[estado]}</StatusBadge>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-subtle" aria-hidden="true" />
            </Card>
          );
        })
      )}
    </div>
  );
}
