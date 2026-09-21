import { COLORS } from "./constants";

export function formatStock(product: { stock: number; unit?: string; unidad?: string }): string {
  const unit = product.unit ?? product.unidad ?? "unidad";
  return unit === "kg" ? `${product.stock.toLocaleString("es-UY")} kg` : `${product.stock} un.`;
}

export function getProductStatus(product: {
  stock: number;
  minimumStock?: number;
  stockMinimo?: number;
}): "normal" | "bajo" | "agotado" {
  const minimumStock = product.minimumStock ?? product.stockMinimo ?? 0;
  if (product.stock <= 0) return "agotado";
  if (product.stock <= minimumStock) return "bajo";
  return "normal";
}

export function getStatusColor(status: string): string {
  if (status === "agotado") return COLORS.agotado;
  if (status === "bajo") return COLORS.bajo;
  return COLORS.normal;
}
