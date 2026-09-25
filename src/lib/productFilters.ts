import { getProductStatus } from "./stock";

export type InventoryFilter = "all" | "low" | "outOfStock";

export interface FilterableProduct {
  nombre?: string;
  name?: string;
  stock: number;
  stockMinimo?: number;
  minimumStock?: number;
}

// Search + status filter used by the Inventario toolbar (search box + FilterChips).
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  query: string,
  filter: InventoryFilter,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return products.filter((p) => {
    const nombre = (p.nombre ?? p.name ?? "").toLowerCase();
    if (normalizedQuery && !nombre.includes(normalizedQuery)) return false;

    if (filter === "all") return true;

    const status = getProductStatus({
      stock: p.stock,
      minimumStock: p.stockMinimo ?? p.minimumStock ?? 0,
    });
    if (filter === "low") return status === "bajo";
    if (filter === "outOfStock") return status === "agotado";
    return true;
  });
}
