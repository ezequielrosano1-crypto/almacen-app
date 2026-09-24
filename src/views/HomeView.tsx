import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  Lock,
  Package,
  PackagePlus,
  Plus,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react";
import type { ReactElement } from "react";
import { CashRegisterStatusCard } from "../components/CashRegisterStatusCard";
import { StatusDot } from "../components/StatusDot";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/PageHeader";
import { buildLineChartGeometry } from "../lib/chart";
import { formatMoney } from "../lib/format";
import type { TopProductItem } from "../lib/metrics";
import { getProductStatus } from "../lib/stock";
import type { WeekSalesBucket } from "../types/domain";
import type { ScreenId, TabId } from "../types/navigation";
import type { StoredCashShift } from "../types/storage";
import type { LowStockProductItem } from "./LowStockView";

export interface HomeViewProps {
  businessName?: string;
  todayTotal?: number;
  todaySalesCount?: number;
  todayProductsSold?: number;
  weekSales?: WeekSalesBucket[];
  salesDelta?: { percent: number; trend: "up" | "down" } | null;
  lowStockProducts?: LowStockProductItem[];
  outOfStockProducts?: LowStockProductItem[];
  topProducts?: TopProductItem[];
  goTabScreen: (tab: TabId, screen: ScreenId) => void;
  cashShift?: StoredCashShift | null;
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 96;

// Alert row: a low/no-stock product with a colored dot and remaining units.
function AlertRow({ product }: { product: LowStockProductItem }): ReactElement {
  const status = getProductStatus({
    stock: product.stock,
    minimumStock: product.stockMinimo ?? product.minimumStock ?? 0,
  });
  const nombre = product.nombre ?? product.name ?? "";
  return (
    <div className="flex items-center gap-3">
      <StatusDot estado={status} />
      <p className="text-sm text-ink-soft">
        <span className="font-medium text-ink">{nombre}</span> — Quedan {product.stock}{" "}
        {(product.unidad ?? product.unit ?? "unidad") === "kg" ? "kg" : "unidades"}
      </p>
    </div>
  );
}

export function HomeView(props: HomeViewProps): ReactElement {
  const businessName = props.businessName?.trim() ?? "";
  const total = props.todayTotal ?? 0;
  const salesCount = props.todaySalesCount ?? 0;
  const productsSold = props.todayProductsSold ?? 0;
  const weekSales = props.weekSales ?? [];
  const salesDelta = props.salesDelta ?? null;
  const lowStock = props.lowStockProducts ?? [];
  const outOfStock = props.outOfStockProducts ?? [];
  const topProducts = props.topProducts ?? [];
  const cashShift = props.cashShift ?? null;
  const goTabScreen = props.goTabScreen;

  const alerts = [...outOfStock, ...lowStock].slice(0, 5);
  const alertsCount = outOfStock.length + lowStock.length;

  const chartValues = weekSales.map((w) => w.total);
  const chart = buildLineChartGeometry(chartValues, CHART_WIDTH, CHART_HEIGHT);

  return (
    <div className="pb-4 space-y-5">
      <PageHeader
        title={businessName ? `Hola, ${businessName}` : "Hola"}
        subtitle="Acá tenés un resumen de cómo va tu negocio hoy."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Wallet}
          label="Ventas hoy"
          value={formatMoney(total)}
          hint={productsSold > 0 ? `${productsSold} vendidos` : "hoy"}
          delta={salesDelta ? { value: `${salesDelta.percent}%`, trend: salesDelta.trend } : undefined}
        />
        <KpiCard icon={Receipt} label="Ventas realizadas" value={String(salesCount)} hint="hoy" />
        <KpiCard
          icon={AlertTriangle}
          label="Stock bajo"
          value={String(lowStock.length)}
          hint="productos"
        />
        <KpiCard
          icon={XCircle}
          label="Sin stock"
          value={String(outOfStock.length)}
          hint="productos"
        />
      </div>

      <CashRegisterStatusCard caja={cashShift} totalHoy={total} />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <p className="font-display font-semibold text-ink">
            Evolución de ventas <span className="text-ink-muted font-normal">(últimos 7 días)</span>
          </p>
          {chart.points.length > 0 ? (
            <div className="mt-4">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full h-24"
                preserveAspectRatio="none"
                role="img"
                aria-label="Evolución de ventas de los últimos 7 días"
              >
                <defs>
                  <linearGradient id="homeChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066FF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {chart.areaPath && <path d={chart.areaPath} fill="url(#homeChartFill)" />}
                <path d={chart.linePath} fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {chart.points.map((p, i) => (
                  <circle
                    key={weekSales[i]?.date ?? i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="#0066FF"
                  />
                ))}
              </svg>
              <div className="flex justify-between text-xs text-ink-subtle mt-1">
                {weekSales.map((w) => (
                  <span key={w.date}>{w.day}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-ink-subtle text-sm mt-3">Todavía no hay ventas para graficar.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-ink">Alertas</p>
            {alertsCount > 0 && (
              <button
                type="button"
                onClick={() => goTabScreen("stock", "lowStock")}
                className="text-xs font-semibold text-brand inline-flex items-center gap-1"
              >
                Ver todas <ArrowRight size={14} />
              </button>
            )}
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-3 mt-3">
              {alerts.map((p) => (
                <AlertRow key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-ink-subtle text-sm mt-3">Sin alertas de stock por ahora.</p>
          )}
        </Card>
      </div>

      {topProducts.length > 0 && (
        <Card>
          <p className="font-display font-semibold text-ink">
            Productos más vendidos <span className="text-ink-muted font-normal">(últimos 7 días)</span>
          </p>
          <div className="space-y-3 mt-3">
            {topProducts.map((p, i) => (
              <div key={p.productId ?? p.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm font-medium text-ink truncate">{p.name}</p>
                <p className="text-sm font-semibold text-ink-soft shrink-0">{p.quantity} u.</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          variant="primary"
          icon={Plus}
          fullWidth
          onClick={() => goTabScreen("sales", "newSale")}
        >
          Nueva venta
        </Button>
        <Button
          variant="secondary"
          icon={PackagePlus}
          fullWidth
          onClick={() => goTabScreen("more", "productForm")}
        >
          Agregar producto
        </Button>
        <Button
          variant="secondary"
          icon={ArrowDownToLine}
          fullWidth
          onClick={() => goTabScreen("stock", "addStockEntry")}
        >
          Ingresar stock
        </Button>
        <Button
          variant="secondary"
          icon={Lock}
          fullWidth
          onClick={() => goTabScreen("sales", "dayClosing")}
        >
          Cierre de caja
        </Button>
      </div>

      {alertsCount > 0 && (
        <Card className="flex items-center gap-3 bg-brand-50 border-brand-100">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white shrink-0">
            <Bell size={18} color="#0066FF" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Stockia te avisa</p>
            <p className="text-sm text-ink-soft">
              {alertsCount} {alertsCount === 1 ? "producto está" : "productos están"} por quedarse
              sin stock. Revisalos ahora.
            </p>
          </div>
          <button
            type="button"
            onClick={() => goTabScreen("stock", "lowStock")}
            className="text-brand shrink-0"
            aria-label="Ver productos con stock bajo"
          >
            <Package size={18} />
          </button>
        </Card>
      )}
    </div>
  );
}
