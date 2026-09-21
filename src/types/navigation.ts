import type { MovementId, ProductId } from "./domain";

export type TabId = "home" | "sales" | "stock" | "movements" | "more";

export type ScreenId =
  | "main"
  | "newSale"
  | "dayClosing"
  | "closingHistory"
  | "productCatalog"
  | "productDetail"
  | "lowStock"
  | "addStockEntry"
  | "adjustStock"
  | "stockMovementDetail"
  | "products"
  | "productForm"
  | "businessInfo"
  | "settings";

export interface ScreenParams {
  productId?: ProductId | null;
  movementId?: MovementId;
}

export interface NavEntry {
  screen: ScreenId;
  params: ScreenParams;
}

export interface NavState {
  tab: TabId;
  stack: NavEntry[];
  current: NavEntry;
}

export interface NavigationActions {
  goTab: (tab: TabId) => void;
  goTabScreen: (tab: TabId, screen: ScreenId, params?: ScreenParams) => void;
  push: (screen: ScreenId, params?: ScreenParams) => void;
  pop: () => void;
  resetStack: () => void;
}
