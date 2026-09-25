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
import type { StockMovementInput } from "../hooks/useStockMovements";
import { COLORS } from "../lib/constants";
import { formatStock } from "../lib/stock";
import { validateStockEntry } from "../lib/validation/forms";
import type { ProductId } from "../types/domain";

export interface StockEntryProductItem {
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

export interface AddStockEntryViewProps {
  products?: StockEntryProductItem[];
  initialProductId?: ProductId | null;
  recordMovement?: (movement: StockMovementInput) => Promise<unknown>;
  pop: () => void;
  resetStack: () => void;
}

interface ConfirmedStockEntry {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export function AddStockEntryView(props: AddStockEntryViewProps) {
  const { pop, resetStack } = props;
  const products = props.products ?? [];
  const initialProductId = props.initialProductId ?? null;
  const recordMovement = props.recordMovement ?? (async () => null);

  const [productoId, setProductoId] = useState<ProductId | null>(initialProductId);
  const [busqueda, setBusqueda] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [confirmada, setConfirmada] = useState<ConfirmedStockEntry | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cantidadError, setCantidadError] = useState<string | undefined>();
  const cantidadRef = useRef<HTMLInputElement>(null);

  const producto = products.find((p) => p.id === productoId);
  const disponibles = products.filter((p) => {
    const nombre = p.nombre ?? p.name ?? "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const confirmar = async () => {
    if (!producto || guardando) return;
    const errors = validateStockEntry({ cantidad });
    setCantidadError(errors.cantidad);
    if (errors.cantidad) {
      cantidadRef.current?.focus();
      return;
    }

    const cant = Number.parseFloat(cantidad);
    const nombre = producto.nombre ?? producto.name ?? "";
    const unidad = producto.unidad ?? producto.unit ?? "unidad";

    // One server call updates the stock and records the movement together; the
    // confirmation only shows once it succeeded (the hook toasts on failure).
    setGuardando(true);
    const saved = await recordMovement({
      tipo: "entrada",
      productoId: producto.id,
      cantidad: cant,
    });
    setGuardando(false);
    if (!saved) return;

    setConfirmada({ nombre, cantidad: cant, unidad });
  };

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Entrada registrada"
        message={`+${confirmada.cantidad}${confirmada.unidad === "kg" ? "kg" : " un."} de ${confirmada.nombre}`}
        buttonLabel="Volver a Stock"
        onDone={resetStack}
      />
    );
  }

  const productoNombre = producto ? (producto.nombre ?? producto.name ?? "") : "";
  const productoUnidad = producto ? (producto.unidad ?? producto.unit ?? "unidad") : "unidad";

  return (
    <div className="pb-4 space-y-3 lg:max-w-2xl">
      <PageHeader title="Agregar entrada" onBack={pop} />
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
              <p className="text-ink-subtle text-xs">Stock actual: {formatStock(producto)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setProductoId(null)} className="text-brand">
              Cambiar
            </Button>
          </div>
          <Field data-invalid={Boolean(cantidadError)}>
            <FieldLabel htmlFor="entry-qty">
              Cantidad a ingresar {productoUnidad === "kg" ? "(kg)" : "(unidades)"}
            </FieldLabel>
            <Input
              id="entry-qty"
              type="number"
              inputMode={productoUnidad === "kg" ? "decimal" : "numeric"}
              step={productoUnidad === "kg" ? "0.001" : "1"}
              min="0"
              ref={cantidadRef}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder={productoUnidad === "kg" ? "0,500" : "0"}
              aria-invalid={Boolean(cantidadError)}
              aria-describedby={cantidadError ? "entry-qty-error" : undefined}
              className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError id="entry-qty-error">{cantidadError}</FieldError>
          </Field>
          <Button fullWidth onClick={confirmar} disabled={guardando}>
            {guardando && <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />}
            Registrar entrada
          </Button>
        </Card>
      )}
    </div>
  );
}
