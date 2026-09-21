import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
import { ProductRow } from "../components/ProductRow";
import { SearchBar } from "../components/SearchBar";
import type { StockMovementInput } from "../hooks/useStockMovements";
import { COLORS } from "../lib/constants";
import { formatStock } from "../lib/stock";
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

  const producto = products.find((p) => p.id === productoId);
  const disponibles = products.filter((p) => {
    const nombre = p.nombre ?? p.name ?? "";
    return nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  const confirmar = async () => {
    const cant = parseFloat(cantidad);
    if (!producto || !cant || cant <= 0 || guardando) return;
    const nombre = producto.nombre ?? producto.name ?? "";
    const unidad = producto.unidad ?? producto.unit ?? "unidad";

    // One server call updates the stock and records the movement together; the
    // confirmation only shows once it succeeded (the hook alerts on failure).
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
    <div>
      <Header title="Agregar entrada" onBack={pop} />
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
                <p className="text-stone-400 text-xs">Stock actual: {formatStock(producto)}</p>
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
                Cantidad a ingresar {productoUnidad === "kg" ? "(kg)" : "(unidades)"}
                <input
                  type="number"
                  step={productoUnidad === "kg" ? "0.001" : "1"}
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder={productoUnidad === "kg" ? "0,500" : "0"}
                  className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
                />
              </label>
            </div>
            <PrimaryButton
              onClick={confirmar}
              disabled={guardando || !cantidad || parseFloat(cantidad) <= 0}
            >
              Registrar entrada
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}
