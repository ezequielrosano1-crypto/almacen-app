import { Header } from "../components/Header";
import { StatusDot } from "../components/StatusDot";
import { formatMoney } from "../lib/format";
import { formatStock, getProductStatus, getStatusColor } from "../lib/stock";
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
  const etiqueta = estado === "agotado" ? "Agotado" : estado === "bajo" ? "Stock bajo" : "Normal";

  return (
    <div>
      <Header title={nombre} onBack={pop} />
      <div className="px-5 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
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
            <span
              className="flex items-center gap-2 font-medium"
              style={{ color: getStatusColor(estado) }}
            >
              <StatusDot estado={estado} />
              {etiqueta}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goTabScreen("stock", "addStockEntry", { productId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#0066FF",
              borderColor: "#0066FF33",
            }}
          >
            Agregar entrada
          </button>
          <button
            type="button"
            onClick={() => goTabScreen("stock", "adjustStock", { productId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#0066FF",
              borderColor: "#0066FF33",
            }}
          >
            Ajustar stock
          </button>
        </div>
      </div>
    </div>
  );
}
