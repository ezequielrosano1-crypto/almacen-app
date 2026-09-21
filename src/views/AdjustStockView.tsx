import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductRow } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import { ADJUSTMENT_REASONS, COLORS } from "../lib/constants";
import { formatStock } from "../lib/stock";
import type { ProductId } from "../types/domain";

export interface AdjustStockProductItem {
  id: ProductId;
  nombre?: string;
  name?: string;
  stock: number;
  unidad?: string;
  unit?: string;
  precio?: number;
  price?: number;
  stockMinimo?: number;
  minimumStock?: number;
}

export interface AdjustStockViewProps {
  products?: AdjustStockProductItem[];
  initialProductId?: ProductId | null;
  updateStock?: (id: ProductId, realStock: number) => void;
  recordMovement?: (movement: Record<string, unknown>) => void;
  pop: () => void;
  resetStack: () => void;
}

interface ConfirmedAdjustment {
  nombre: string;
  diferencia: number;
}

export function AdjustStockView(props: AdjustStockViewProps) {
  const { pop, resetStack } = props;
  const products = props.products ?? [];
  const initialProductId = props.initialProductId ?? null;
  const updateStock = props.updateStock ?? (() => {});
  const recordMovement = props.recordMovement ?? (() => {});

  const [productoId, setProductoId] = useState<ProductId | null>(initialProductId);
  const [busqueda, setBusqueda] = useState("");
  const [stockReal, setStockReal] = useState("");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<ConfirmedAdjustment | null>(null);

  const producto = products.find((p) => p.id === productoId);
  const disponibles = products.filter((p) => {
    const nombre = p.nombre ?? p.name ?? "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const confirmar = () => {
    const real = parseFloat(stockReal);
    if (!producto || Number.isNaN(real) || real < 0 || !motivo) return;
    const nombre = producto.nombre ?? producto.name ?? "";
    const diferencia = Math.round((real - producto.stock) * 100) / 100;

    updateStock(producto.id, real);
    recordMovement({
      tipo: "ajuste",
      producto: nombre,
      diferencia,
      motivo,
    });
    setConfirmada({ nombre, diferencia });
  };

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Ajuste registrado"
        message={`${confirmada.nombre}: diferencia ${confirmada.diferencia > 0 ? "+" : ""}${confirmada.diferencia}`}
        buttonLabel="Volver a Stock"
        onDone={resetStack}
      />
    );
  }

  const productoNombre = producto ? (producto.nombre ?? producto.name ?? "") : "";
  const productoUnidad = producto ? (producto.unidad ?? producto.unit ?? "unidad") : "unidad";

  return (
    <div>
      <Header title="Ajustar stock" onBack={pop} />
      <div className="px-5 space-y-3">
        {!producto ? (
          <>
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
            <div className="space-y-2">
              {disponibles.map((p) => (
                <ProductRow key={p.id} producto={p} onClick={() => setProductoId(p.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-stone-800 font-medium text-sm">{productoNombre}</p>
                <p className="text-stone-400 text-xs">Stock registrado: {formatStock(producto)}</p>
              </div>
              <button
                type="button"
                onClick={() => setProductoId(null)}
                className="text-sm font-medium"
                style={{ color: "#2E6B4F" }}
              >
                Cambiar
              </button>
            </div>
            <div>
              <label className="text-stone-500 text-sm block">
                Stock real contado
                <input
                  type="number"
                  step={productoUnidad === "kg" ? "0.001" : "1"}
                  min="0"
                  value={stockReal}
                  onChange={(e) => setStockReal(e.target.value)}
                  className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
                />
              </label>
            </div>
            <div>
              <p className="text-stone-500 text-sm mb-2 block">Motivo del ajuste</p>
              <div className="grid grid-cols-2 gap-2">
                {ADJUSTMENT_REASONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMotivo(m)}
                    className="rounded-xl py-2.5 text-sm font-medium border"
                    style={
                      motivo === m
                        ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                        : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                    }
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <PrimaryButton onClick={confirmar} disabled={stockReal === "" || !motivo}>
              Confirmar ajuste
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}
