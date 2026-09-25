import type { ReactElement } from "react";
import { formatMoney } from "../lib/format";
import { formatStock, getProductStatus } from "../lib/stock";
import type { MeasurementUnit, ProductId } from "../types/domain";
import { Card } from "./common/Card";
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
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
      <span className="text-ink-soft text-sm font-medium tabular-nums">
        {formatStock({ stock: producto.stock, unit: unidad })}
      </span>
    </Card>
  );
}
