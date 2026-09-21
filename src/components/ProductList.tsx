import type { ReactElement } from "react";
import type { ProductId } from "../types/domain";
import { ProductRow, type ProductRowItem } from "./ProductRow";

export interface ProductListProps {
  productos: ProductRowItem[];
  busqueda: string;
  onProductoClick: (id: ProductId) => void;
}

// Lista filtrada y ordenada alfabéticamente de productos.
export function ProductList({
  productos,
  busqueda,
  onProductoClick,
}: ProductListProps): ReactElement {
  const disponibles = productos
    .filter((p) => {
      const nombre = p.nombre ?? p.name ?? "";
      return nombre.toLowerCase().includes(busqueda.toLowerCase());
    })
    .sort((a, b) => {
      const nombreA = a.nombre ?? a.name ?? "";
      const nombreB = b.nombre ?? b.name ?? "";
      return nombreA.localeCompare(nombreB);
    });

  return (
    <div className="space-y-2">
      {disponibles.length > 0 ? (
        disponibles.map((p) => (
          <ProductRow key={p.id} producto={p} onClick={() => onProductoClick(p.id)} />
        ))
      ) : (
        <p className="text-stone-400 text-xs text-center py-6">
          Ningún producto coincide con la búsqueda
        </p>
      )}
    </div>
  );
}
