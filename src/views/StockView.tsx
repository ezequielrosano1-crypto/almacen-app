import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Package,
  PackageX,
  Pencil,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { EmptyState } from "../components/common/EmptyState";
import { FilterChips } from "../components/common/FilterChips";
import { KpiCard } from "../components/common/KpiCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
          <Button icon={Plus} onClick={() => push("productForm")}>
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
          {/* Mobile: 2-column grid so the actions never overflow; desktop: inline row. */}
          <div className="grid w-full grid-cols-2 gap-2 lg:flex lg:w-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={SlidersHorizontal}
              className="w-full lg:w-auto"
              onClick={() => push("adjustStock")}
            >
              Ajustar stock
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              className="w-full lg:w-auto"
              onClick={() => push("addStockEntry")}
            >
              Ingresar stock
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowRightLeft}
              className="col-span-2 w-full lg:col-auto lg:w-auto"
              onClick={() => push("movements")}
            >
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
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-ink-muted">Producto</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted">Código de barras</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted text-right">Precio</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted text-right">Stock</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted">Estado</TableHead>
                  <TableHead className="px-4 py-3 text-ink-muted text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => {
                  const nombre = p.nombre ?? p.name ?? "";
                  const precio = p.precio ?? p.price ?? 0;
                  const unidad = p.unidad ?? p.unit ?? "unidad";
                  const stockMinimo = p.stockMinimo ?? p.minimumStock ?? 0;
                  const status = getProductStatus({ stock: p.stock, minimumStock: stockMinimo });
                  const barcode = p.barcode ?? p.codigoBarras ?? "—";
                  return (
                    <TableRow
                      key={p.id}
                      className="border-line-soft cursor-pointer"
                      onClick={() => push("productDetail", { productId: p.id })}
                    >
                      <TableCell className="px-4 py-3 font-medium text-ink">{nombre}</TableCell>
                      <TableCell className="px-4 py-3 text-ink-muted">{barcode}</TableCell>
                      <TableCell className="px-4 py-3 text-ink text-right tabular-nums">
                        {formatMoney(precio)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-ink text-right tabular-nums">
                        {formatStock({ stock: p.stock, unit: unidad })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <StatusBadge tone={getStatusTone(status)}>{STATUS_LABEL[status]}</StatusBadge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              static
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Acciones de ${nombre}`}
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal size={16} strokeWidth={2} aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onSelect={() => push("productDetail", { productId: p.id })}>
                              <Eye size={14} strokeWidth={1.5} aria-hidden="true" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => push("productForm", { productId: p.id })}
                            >
                              <Pencil size={14} strokeWidth={1.5} aria-hidden="true" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => push("addStockEntry", { productId: p.id })}>
                              <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
                              Ingresar stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => push("adjustStock", { productId: p.id })}>
                              <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
                              Ajustar stock
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
                <Card
                  key={p.id}
                  padded
                  role="button"
                  tabIndex={0}
                  onClick={() => push("productDetail", { productId: p.id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      push("productDetail", { productId: p.id });
                    }
                  }}
                  className="w-full flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                    <span className="text-ink-soft text-sm font-medium tabular-nums">
                      {formatStock({ stock: p.stock, unit: unidad })}
                    </span>
                    <ChevronRight size={18} className="text-ink-subtle" aria-hidden="true" />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
