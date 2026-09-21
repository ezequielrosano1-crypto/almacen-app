import { COLORS } from "./constants";

export function formatStock(product: { stock: number; unit: string }): string {
  return product.unit === "kg"
    ? `${product.stock.toLocaleString("es-UY")} kg`
    : `${product.stock} un.`;
}

export function getProductStatus(product: {
  stock: number;
  minimumStock: number;
}): "normal" | "bajo" | "agotado" {
  if (product.stock <= 0) return "agotado";
  if (product.stock <= product.minimumStock) return "bajo";
  return "normal";
}

export function getStatusColor(status: string): string {
  if (status === "agotado") return COLORS.agotado;
  if (status === "bajo") return COLORS.bajo;
  return COLORS.normal;
}
