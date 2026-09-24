import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { formatMoney } from "../lib/format";
import { formatStock, getProductStatus, getStatusTone } from "../lib/stock";
import type { ProductId } from "../types/domain";
import type { ScreenId, ScreenParams, TabId } from "../types/navigation";

export interface ProductDetailItem {
  id: ProductId;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  unidad?: string;
  unit?: string;
  stock: number;
  stockMinimo?: number;
  minimumStock?: number;
}

export interface ProductDetailViewProps {
  products?: ProductDetailItem[];
  productId?: ProductId | null;
  pop: () => void;
  goTabScreen: (tab: TabId, screen: ScreenId, params?: ScreenParams) => void;
}

const STATUS_LABEL: Record<string, string> = {
  normal: "Normal",
  bajo: "Stock bajo",
  agotado: "Agotado",
};

export function ProductDetailView(props: ProductDetailViewProps) {
  const { pop, goTabScreen } = props;
  const products = props.products ?? [];
  const productId = props.productId;

  const p = products.find((pr) => pr.id === productId);
  if (!p) return null;

  const nombre = p.nombre ?? p.name ?? "";
  const precio = p.precio ?? p.price ?? 0;
  const unidad = p.unidad ?? p.unit ?? "unidad";
  const stockMinimo = p.stockMinimo ?? p.minimumStock ?? 0;

  const estado = getProductStatus(p);

  return (
    <div className="pb-4 space-y-3 lg:max-w-2xl">
      <PageHeader title={nombre} onBack={pop} />
      <Card className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Precio</span>
          <span className="text-ink font-medium">{formatMoney(precio)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Stock actual</span>
          <span className="text-ink font-medium">{formatStock(p)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Stock mínimo</span>
          <span className="text-ink font-medium">
            {stockMinimo} {unidad === "kg" ? "kg" : "un."}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm border-t border-line-soft pt-3">
          <span className="text-ink-muted">Estado</span>
          <StatusBadge tone={getStatusTone(estado)}>{STATUS_LABEL[estado]}</StatusBadge>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => goTabScreen("stock", "addStockEntry", { productId: p.id })}
        >
          Agregar entrada
        </Button>
        <Button
          variant="secondary"
          onClick={() => goTabScreen("stock", "adjustStock", { productId: p.id })}
        >
          Ajustar stock
        </Button>
      </div>
    </div>
  );
}
