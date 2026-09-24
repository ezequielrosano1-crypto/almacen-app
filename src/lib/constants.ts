export const COLORS = {
  principal: "#0066FF",
  fondo: "#F5F7FB",
  normal: "#0066FF",
  bajo: "#F59E0B",
  agotado: "#DC2626",
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
