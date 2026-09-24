import type { ReactElement } from "react";
import { formatMoney } from "../lib/format";
import { formatStock, getProductStatus } from "../lib/stock";
import type { MeasurementUnit, ProductId } from "../types/domain";
import { StatusDot } from "./StatusDot";

export interface ProductRowItem {
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
}

export interface ProductRowProps {
  producto: ProductRowItem;
  onClick: () => void;
}

// Fila representativa de un producto con punto de estado, nombre, precio y stock.
export function ProductRow({ producto, onClick }: ProductRowProps): ReactElement {
  const nombre = producto.nombre ?? producto.name ?? "";
  const precio = producto.precio ?? producto.price ?? 0;
  const unidad = (producto.unidad ?? producto.unit ?? "unidad") as MeasurementUnit;
  const stockMinimo = producto.stockMinimo ?? producto.minimumStock ?? 0;

  const estado = getProductStatus({
    stock: producto.stock,
    minimumStock: stockMinimo,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
    >
      <div className="flex items-center gap-3">
        <StatusDot estado={estado} />
        <div>
          <p className="text-ink font-medium text-sm">{nombre}</p>
          <p className="text-ink-subtle text-xs">
            {formatMoney(precio)}
            {unidad === "kg" ? " / kg" : ""}
          </p>
        </div>
      </div>
      <span className="text-ink-soft text-sm font-medium">
        {formatStock({ stock: producto.stock, unit: unidad })}
      </span>
    </button>
  );
}
