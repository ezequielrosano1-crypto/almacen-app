import { CheckCircle2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { ProductRow } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { Field, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import type { StockMovementInput } from "../hooks/useStockMovements";
import { ADJUSTMENT_REASONS, COLORS } from "../lib/constants";
import { formatStock } from "../lib/stock";
import { validateStockAdjustment } from "../lib/validation/forms";
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
  const [errors, setErrors] = useState<{ stockReal?: string; motivo?: string }>({});
  const stockRealRef = useRef<HTMLInputElement>(null);

  const producto = products.find((p) => p.id === productoId);
  const disponibles = products.filter((p) => {
    const nombre = p.nombre ?? p.name ?? "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const confirmar = async () => {
    if (!producto || guardando) return;
    const fieldErrors = validateStockAdjustment({ stockReal, motivo });
    setErrors(fieldErrors);
    if (fieldErrors.stockReal) {
      stockRealRef.current?.focus();
      return;
    }
    if (fieldErrors.motivo) return;

    const real = Number.parseFloat(stockReal);
    const nombre = producto.nombre ?? producto.name ?? "";

    // The server compares against the stock it holds (not the possibly stale one on this
    // screen), updates it and records the adjustment in one transaction.
    setGuardando(true);
    const saved = await recordMovement({
      tipo: "ajuste",
      productoId: producto.id,
      cantidad: real,
      motivo: motivo as string,
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
            <Button variant="ghost" size="sm" onClick={() => setProductoId(null)} className="text-brand">
              Cambiar
            </Button>
          </div>
          <Field data-invalid={Boolean(errors.stockReal)}>
            <FieldLabel htmlFor="adjust-stock">Stock real contado</FieldLabel>
            <Input
              id="adjust-stock"
              type="number"
              inputMode={productoUnidad === "kg" ? "decimal" : "numeric"}
              step={productoUnidad === "kg" ? "0.001" : "1"}
              min="0"
              ref={stockRealRef}
              value={stockReal}
              onChange={(e) => setStockReal(e.target.value)}
              aria-invalid={Boolean(errors.stockReal)}
              aria-describedby={errors.stockReal ? "adjust-stock-error" : undefined}
              className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError id="adjust-stock-error">{errors.stockReal}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.motivo)}>
            <FieldLabel id="adjust-reason-label">Motivo del ajuste</FieldLabel>
            {/* ToggleGroup, not Select: only 4 short options, all visible at once beats an
                extra open+choose step on a touch device (better-ui hit-areas). */}
            <ToggleGroup
              type="single"
              spacing={2}
              value={motivo ?? ""}
              onValueChange={(next) => {
                if (next) setMotivo(next);
              }}
              aria-labelledby="adjust-reason-label"
              className="grid grid-cols-2 gap-2 w-full"
            >
              {ADJUSTMENT_REASONS.map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className="h-10 pointer-coarse:h-11 rounded-xl text-sm font-medium border border-line data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:border-brand data-[state=off]:bg-white data-[state=off]:text-ink-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {m}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldError id="adjust-reason-error">{errors.motivo}</FieldError>
          </Field>
          <Button fullWidth onClick={confirmar} disabled={guardando}>
            {guardando && <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />}
            Confirmar ajuste
          </Button>
        </Card>
      )}
    </div>
  );
}
