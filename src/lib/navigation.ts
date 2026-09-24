// Single source of truth for the app's top-level sections (STOCKIA mockups).
//
// Nav mapping decision (documented per T1):
// - Desktop sidebar shows all 7 sections, "Configuración" being the label for
//   the `more` tab.
// - Mobile bottom bar only fits 5 slots: Inicio, Inventario, Ventas, Compras
//   and a "Más" hub (same `more` tab, labeled differently). The hub screen
//   (MoreView) lists the sections that don't fit the bar: Proveedores,
//   Reportes, Configuración, plus the existing MoreView entries (Productos,
//   Información del negocio).
// - Stock movements (`movements` tab) is folded into `stock` as a screen
//   (`movements` / `stockMovementDetail`), reachable from StockView.
import {
  BarChart3,
  Home,
  type LucideIcon,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type { TabId } from "../types/navigation";

export interface NavConfigItem {
  key: TabId;
  label: string;
  icon: LucideIcon;
  desktop: true;
}

// All 7 sections, in mockup order, for the desktop sidebar.
export const DESKTOP_NAV_ITEMS: NavConfigItem[] = [
  { key: "home", label: "Inicio", icon: Home, desktop: true },
  { key: "stock", label: "Inventario", icon: Package, desktop: true },
  { key: "sales", label: "Ventas", icon: ShoppingCart, desktop: true },
  { key: "purchases", label: "Compras", icon: ShoppingBag, desktop: true },
  { key: "suppliers", label: "Proveedores", icon: Truck, desktop: true },
  { key: "reports", label: "Reportes", icon: BarChart3, desktop: true },
  { key: "more", label: "Configuración", icon: Settings, desktop: true },
];

const MOBILE_KEYS: TabId[] = ["home", "stock", "sales", "purchases", "more"];

// The 5-slot mobile bottom bar subset; "more" is relabeled "Más" since on
// mobile it opens the hub screen rather than a single settings screen.
export const MOBILE_NAV_ITEMS: NavConfigItem[] = MOBILE_KEYS.map((key) => {
  const item = DESKTOP_NAV_ITEMS.find((i) => i.key === key);
  if (!item) throw new Error(`Missing desktop nav config for mobile key "${key}"`);
  return key === "more" ? { ...item, label: "Más" } : item;
});
