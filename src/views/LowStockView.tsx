import { ChevronRight, PackageX } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
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
            <button
              type="button"
              key={p.id}
              onClick={() => onOpenDetalle(p.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div>
                <p className="text-ink font-medium text-sm">{nombre}</p>
                <p className="text-ink-subtle text-xs mt-0.5">Actual: {formatStock(p)}</p>
                <div className="mt-1.5">
                  <StatusBadge tone={getStatusTone(estado)}>{STATUS_LABEL[estado]}</StatusBadge>
                </div>
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </button>
          );
        })
      )}
    </div>
  );
}
