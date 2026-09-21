import { ChevronRight } from "lucide-react";
import { Header } from "../components/Header";
import { StatusDot } from "../components/StatusDot";
import { formatStock, getProductStatus } from "../lib/stock";
import type { ProductId } from "../types/domain";

export interface LowStockProductItem {
  id: ProductId;
  nombre?: string;
  name?: string;
  stock: number;
  stockMinimo?: number;
  minimumStock?: number;
  unidad?: string;
  unit?: string;
}

export interface LowStockViewProps {
  outOfStockProducts?: LowStockProductItem[];
  lowStockProducts?: LowStockProductItem[];
  productosAgotados?: LowStockProductItem[];
  productosBajo?: LowStockProductItem[];
  pop: () => void;
  onOpenDetail?: (id: ProductId) => void;
  onOpenDetalle?: (id: ProductId) => void;
}

export function LowStockView(props: LowStockViewProps) {
  const { pop } = props;
  const productosAgotados = props.outOfStockProducts ?? props.productosAgotados ?? [];
  const productosBajo = props.lowStockProducts ?? props.productosBajo ?? [];
  const onOpenDetalle = props.onOpenDetail ?? props.onOpenDetalle ?? (() => {});

  const lista = [...productosAgotados, ...productosBajo];
  return (
    <div>
      <Header title="Stock bajo" onBack={pop} />
      <div className="px-5 space-y-2">
        {lista.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-6">No hay productos para revisar</p>
        )}
        {lista.map((p) => {
          const estado = getProductStatus(p);
          const nombre = p.nombre ?? p.name ?? "";
          const stockMinimo = p.stockMinimo ?? p.minimumStock ?? 0;
          const unidad = p.unidad ?? p.unit ?? "unidad";

          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onOpenDetalle(p.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <StatusDot estado={estado} />
                <div>
                  <p className="text-stone-800 font-medium text-sm">{nombre}</p>
                  <p className="text-stone-400 text-xs">
                    Actual: {formatStock(p)} · Mínimo: {stockMinimo}{" "}
                    {unidad === "kg" ? "kg" : "un."}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} color="#B8B2A5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
