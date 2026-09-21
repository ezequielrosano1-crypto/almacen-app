export const COLORS = {
  principal: "#2E6B4F",
  fondo: "#FAF8F5",
  normal: "#2E6B4F",
  bajo: "#E0A526",
  agotado: "#C0392B",
} as const;

export const ADJUSTMENT_REASONS = [
  "Conteo físico",
  "Producto vencido/roto",
  "Error de carga",
  "Otro",
] as const;

export const CASH_SHIFT_STORAGE_KEY = "caja:jornada";
export const TEST_CASH_SHIFT_STORAGE_KEY = "caja:jornada:test";

export const BUSINESS_ID = 1;

export const STORAGE_KEYS = {
  stockMovements: "datos:movimientos",
  businessInfo: "datos:infoNegocio",
  products: "datos:productos",
  cashShift: CASH_SHIFT_STORAGE_KEY,
  testCashShift: TEST_CASH_SHIFT_STORAGE_KEY,
} as const;
