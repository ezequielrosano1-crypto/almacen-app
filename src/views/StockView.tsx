import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  Package,
  PackageX,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { FilterChips } from "../components/ui/FilterChips";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatMoney } from "../lib/format";
import { type InventoryFilter, filterProducts } from "../lib/productFilters";
import { formatStock, getProductStatus, getStatusTone } from "../lib/stock";
import type { ProductId } from "../types/domain";
import type { ScreenId, ScreenParams, TabId } from "../types/navigation";

export interface InventoryProductItem {
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
  barcode?: string | null;
  codigoBarras?: string | null;
}

export interface StockViewProps {
  products?: InventoryProductItem[];
  push: (screen: ScreenId, params?: ScreenParams) => void;
  goTabScreen: (tab: TabId, screen: ScreenId, params?: ScreenParams) => void;
}

const STATUS_LABEL: Record<string, string> = {
  normal: "En stock",
  bajo: "Stock bajo",
  agotado: "Sin stock",
};

const FILTER_OPTIONS: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "low", label: "Bajo stock" },
  { value: "outOfStock", label: "Sin stock" },
];

// Inventario: the `stock` tab landing screen. Merges what used to be
// ProductCatalogView's browsing UX into one page with KPIs, search, status
// filters and quick access to the other stock flows (entry/adjust/movements).
export function StockView({ products, push, goTabScreen }: StockViewProps) {
  const items = products ?? [];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("all");

  const lowStockCount = items.filter(
    (p) => getProductStatus({ stock: p.stock, minimumStock: p.stockMinimo ?? p.minimumStock ?? 0 }) === "bajo",
  ).length;
  const outOfStockCount = items.filter(
    (p) =>
      getProductStatus({ stock: p.stock, minimumStock: p.stockMinimo ?? p.minimumStock ?? 0 }) === "agotado",
  ).length;

  const visible = filterProducts(items, query, filter).sort((a, b) => {
    const nombreA = a.nombre ?? a.name ?? "";
    const nombreB = b.nombre ?? b.name ?? "";
    return nombreA.localeCompare(nombreB);
  });

  return (
    <div className="pb-4 space-y-5">
      <PageHeader
        title="Inventario"
        subtitle="Controlá tu stock, organizá tus productos y nunca te quedes sin lo que más vendés."
        action={
          <Button icon={Plus} onClick={() => goTabScreen("more", "productForm")}>
            Agregar producto
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard icon={Package} label="Total de productos" value={String(items.length)} />
        <KpiCard icon={AlertTriangle} label="Stock bajo" value={String(lowStockCount)} hint="productos" />
        <KpiCard icon={PackageX} label="Sin stock" value={String(outOfStockCount)} hint="productos" />
      </div>

      <Card className="space-y-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar producto..." />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterChips options={FILTER_OPTIONS} value={filter} onChange={(v) => setFilter(v as InventoryFilter)} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => push("adjustStock")}>
              Ajustar stock
            </Button>
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => push("addStockEntry")}>
              Ingresar stock
            </Button>
            <Button variant="ghost" size="sm" icon={ArrowRightLeft} onClick={() => push("movements")}>
              Movimientos
            </Button>
          </div>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title={items.length === 0 ? "Todavía no cargaste productos" : "Ningún producto coincide"}
          description={
            items.length === 0
              ? "Agregá tu primer producto para empezar a controlar el stock."
              : "Probá con otra búsqueda o cambiá el filtro."
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card padded={false} className="hidden lg:block overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted border-b border-line">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Código de barras</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const nombre = p.nombre ?? p.name ?? "";
                  const precio = p.precio ?? p.price ?? 0;
                  const unidad = p.unidad ?? p.unit ?? "unidad";
                  const stockMinimo = p.stockMinimo ?? p.minimumStock ?? 0;
                  const status = getProductStatus({ stock: p.stock, minimumStock: stockMinimo });
                  const barcode = p.barcode ?? p.codigoBarras ?? "—";
                  return (
                    <tr key={p.id} className="border-b border-line-soft last:border-0 hover:bg-line-soft/50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => push("productDetail", { productId: p.id })}
                          className="font-medium text-ink text-left"
                        >
                          {nombre}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{barcode}</td>
                      <td className="px-4 py-3 text-ink">{formatMoney(precio)}</td>
                      <td className="px-4 py-3 text-ink">{formatStock({ stock: p.stock, unit: unidad })}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={getStatusTone(status)}>{STATUS_LABEL[status]}</StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => goTabScreen("more", "productForm", { productId: p.id })}
                          className="text-brand font-medium"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {visible.map((p) => {
              const nombre = p.nombre ?? p.name ?? "";
              const precio = p.precio ?? p.price ?? 0;
              const unidad = p.unidad ?? p.unit ?? "unidad";
              const stockMinimo = p.stockMinimo ?? p.minimumStock ?? 0;
              const status = getProductStatus({ stock: p.stock, minimumStock: stockMinimo });
              const barcode = p.barcode ?? p.codigoBarras;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => push("productDetail", { productId: p.id })}
                  className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
                >
                  <div className="min-w-0">
                    <p className="text-ink font-medium text-sm truncate">{nombre}</p>
                    {barcode && <p className="text-ink-subtle text-xs">{barcode}</p>}
                    <p className="text-ink-soft text-xs mt-0.5">{formatMoney(precio)}</p>
                    <div className="mt-1.5">
                      <StatusBadge tone={getStatusTone(status)}>{STATUS_LABEL[status]}</StatusBadge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-ink-soft text-sm font-medium">
                      {formatStock({ stock: p.stock, unit: unidad })}
                    </span>
                    <ChevronRight size={18} color="#94A3B8" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
