import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { ProductRow } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import type { StockMovementInput } from "../hooks/useStockMovements";
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
  recordMovement?: (movement: StockMovementInput) => Promise<AdjustmentResult | null>;
  pop: () => void;
  resetStack: () => void;
}

// Only what the view needs from the server result.
interface AdjustmentResult {
  movimiento: { diferencia: number | null };
}

interface ConfirmedAdjustment {
  nombre: string;
  diferencia: number;
}

export function AdjustStockView(props: AdjustStockViewProps) {
  const { pop, resetStack } = props;
  const products = props.products ?? [];
  const initialProductId = props.initialProductId ?? null;
  const recordMovement = props.recordMovement ?? (async () => null);

  const [productoId, setProductoId] = useState<ProductId | null>(initialProductId);
  const [busqueda, setBusqueda] = useState("");
  const [stockReal, setStockReal] = useState("");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<ConfirmedAdjustment | null>(null);
  const [guardando, setGuardando] = useState(false);

  const producto = products.find((p) => p.id === productoId);
  const disponibles = products.filter((p) => {
    const nombre = p.nombre ?? p.name ?? "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const confirmar = async () => {
    const real = parseFloat(stockReal);
    if (!producto || Number.isNaN(real) || real < 0 || !motivo || guardando) return;
    const nombre = producto.nombre ?? producto.name ?? "";

    // The server compares against the stock it holds (not the possibly stale one on this
    // screen), updates it and records the adjustment in one transaction.
    setGuardando(true);
    const saved = await recordMovement({
      tipo: "ajuste",
      productoId: producto.id,
      cantidad: real,
      motivo,
    });
    setGuardando(false);
    if (!saved) return;

    setConfirmada({ nombre, diferencia: Number(saved.movimiento.diferencia ?? 0) });
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
    <div className="pb-4 space-y-3 lg:max-w-2xl">
      <PageHeader title="Ajustar stock" onBack={pop} />
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
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-ink font-medium text-sm">{productoNombre}</p>
              <p className="text-ink-subtle text-xs">Stock registrado: {formatStock(producto)}</p>
            </div>
            <button
              type="button"
              onClick={() => setProductoId(null)}
              className="text-sm font-medium text-brand"
            >
              Cambiar
            </button>
          </div>
          <div>
            <label className="text-ink-soft text-sm font-medium block" htmlFor="adjust-stock">
              Stock real contado
            </label>
            <input
              id="adjust-stock"
              type="number"
              step={productoUnidad === "kg" ? "0.001" : "1"}
              min="0"
              value={stockReal}
              onChange={(e) => setStockReal(e.target.value)}
              className="w-full rounded-xl border border-line px-4 py-3 mt-1.5 outline-none text-ink focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <p className="text-ink-soft text-sm font-medium mb-2">Motivo del ajuste</p>
            <div className="grid grid-cols-2 gap-2">
              {ADJUSTMENT_REASONS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMotivo(m)}
                  className={[
                    "rounded-xl py-2.5 text-sm font-medium border transition-colors",
                    motivo === m
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-ink-soft border-line",
                  ].join(" ")}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth onClick={confirmar} disabled={guardando || stockReal === "" || !motivo}>
            Confirmar ajuste
          </Button>
        </Card>
      )}
    </div>
  );
}
