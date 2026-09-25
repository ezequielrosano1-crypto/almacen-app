import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { BarcodeScanner } from "../components/BarcodeScanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { Field, FieldDescription, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import type { ProductDraft } from "../hooks/useProducts";
import { type FieldErrors, validateProductForm } from "../lib/validation/forms";
import type { ProductId } from "../types/domain";

export interface ProductFormData {
  id: ProductId;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
  unidad?: string;
  unit?: string;
  stock?: number;
  stockMinimo?: number;
  minimumStock?: number;
  codigoBarras?: string | null;
  barcode?: string | null;
}

export interface ProductFormViewProps {
  products?: ProductFormData[];
  productId?: ProductId | null;
  saveProduct?: (product: ProductDraft) => unknown;
  deleteProduct?: (id: ProductId) => unknown;
  pop: () => void;
}

export function ProductFormView(props: ProductFormViewProps) {
  const { pop } = props;
  const products = props.products ?? [];
  const productId = props.productId ?? null;
  const saveProduct = props.saveProduct ?? (() => {});
  const deleteProduct = props.deleteProduct ?? (() => {});

  const existente = products.find((p) => p.id === productId);
  const esNuevo = !existente;

  const initialNombre = existente?.nombre ?? existente?.name ?? "";
  const initialPrecio =
    existente && (existente.precio !== undefined || existente.price !== undefined)
      ? String(existente.precio ?? existente.price)
      : "";
  const initialUnidad = existente?.unidad ?? existente?.unit ?? "unidad";
  const initialStock = existente && existente.stock !== undefined ? String(existente.stock) : "";
  const initialStockMinimo =
    existente && (existente.stockMinimo !== undefined || existente.minimumStock !== undefined)
      ? String(existente.stockMinimo ?? existente.minimumStock)
      : "";
  const initialCodigoBarras = existente?.codigoBarras ?? existente?.barcode ?? "";

  const [nombre, setNombre] = useState(initialNombre);
  const [precio, setPrecio] = useState(initialPrecio);
  const [unidad, setUnidad] = useState(initialUnidad);
  const [stock, setStock] = useState(initialStock);
  const [stockMinimo, setStockMinimo] = useState(initialStockMinimo);
  const [codigoBarras, setCodigoBarras] = useState(initialCodigoBarras);
  const [escaneandoCodigo, setEscaneandoCodigo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const nombreRef = useRef<HTMLInputElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const stockMinimoRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    nombre: nombreRef,
    precio: precioRef,
    stock: stockRef,
    stockMinimo: stockMinimoRef,
  };

  const guardar = async () => {
    if (guardando) return;
    const fieldErrors = validateProductForm({ nombre, precio, stock, stockMinimo });
    setErrors(fieldErrors);
    const firstInvalid = Object.keys(fieldErrors)[0];
    if (firstInvalid) {
      fieldRefs[firstInvalid]?.current?.focus();
      return;
    }

    const finalBarcode = codigoBarras.trim() ? codigoBarras.trim() : null;
    const nuevoProducto = {
      id: existente?.id,
      nombre,
      precio: Number.parseFloat(precio),
      unidad,
      stock: Number.parseFloat(stock),
      stockMinimo: Number.parseFloat(stockMinimo),
      codigoBarras: finalBarcode,
    };

    setGuardando(true);
    try {
      await saveProduct(nuevoProducto);
      pop();
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!existente || eliminando) return;
    setEliminando(true);
    try {
      await deleteProduct(existente.id);
      pop();
    } finally {
      setEliminando(false);
      setConfirmandoEliminar(false);
    }
  };

  return (
    <div className="pb-6 lg:max-w-2xl">
      <PageHeader title={esNuevo ? "Nuevo producto" : "Editar producto"} onBack={pop} />
      <Card className="space-y-4">
        <Field data-invalid={Boolean(errors.nombre)}>
          <FieldLabel htmlFor="product-name">Nombre</FieldLabel>
          <Input
            id="product-name"
            ref={nombreRef}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="off"
            aria-invalid={Boolean(errors.nombre)}
            aria-describedby={errors.nombre ? "product-name-error" : undefined}
            className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
          />
          <FieldError id="product-name-error">{errors.nombre}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="product-barcode">Código de barras (opcional)</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="product-barcode"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="7791234567890"
              className="h-10 pointer-coarse:h-11 flex-1 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              variant="secondary"
              size="md"
              static
              onClick={() => setEscaneandoCodigo(true)}
              aria-label="Escanear código de barras"
              className="shrink-0 w-12 px-0"
            >
              <Camera size={20} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
          <FieldDescription>
            Mejor escanealo con la cámara que tipearlo: así queda idéntico al código que la caja va
            a leer después, sin errores de tipeo.
          </FieldDescription>
        </Field>

        <Field data-invalid={Boolean(errors.precio)}>
          <FieldLabel htmlFor="product-price">Precio de venta</FieldLabel>
          <Input
            id="product-price"
            type="number"
            inputMode="decimal"
            ref={precioRef}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            aria-invalid={Boolean(errors.precio)}
            aria-describedby={errors.precio ? "product-price-error" : undefined}
            className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
          />
          <FieldError id="product-price-error">{errors.precio}</FieldError>
        </Field>

        <Field>
          <FieldLabel id="product-unit-label">Unidad de medida</FieldLabel>
          <ToggleGroup
            type="single"
            spacing={2}
            value={unidad}
            onValueChange={(next) => {
              if (next && esNuevo) setUnidad(next);
            }}
            aria-labelledby="product-unit-label"
            className="flex w-full gap-2"
          >
            {(["unidad", "kg"] as const).map((u) => (
              <ToggleGroupItem
                key={u}
                value={u}
                disabled={!esNuevo}
                aria-label={u === "unidad" ? "Por unidad" : "Por peso (kg)"}
                className="flex-1 h-10 pointer-coarse:h-11 rounded-xl text-sm font-medium border border-line data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:border-brand data-[state=off]:bg-white data-[state=off]:text-ink-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {u === "unidad" ? "Por unidad" : "Por peso (kg)"}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {!esNuevo && (
            <FieldDescription>La unidad de medida no se puede cambiar luego de creado.</FieldDescription>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={Boolean(errors.stock)}>
            <FieldLabel htmlFor="product-stock">Stock {esNuevo ? "inicial" : "actual"}</FieldLabel>
            <Input
              id="product-stock"
              type="number"
              inputMode="numeric"
              step={unidad === "kg" ? "0.001" : "1"}
              ref={stockRef}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              aria-invalid={Boolean(errors.stock)}
              aria-describedby={errors.stock ? "product-stock-error" : undefined}
              className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError id="product-stock-error">{errors.stock}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.stockMinimo)}>
            <FieldLabel htmlFor="product-min-stock">Stock mínimo</FieldLabel>
            <Input
              id="product-min-stock"
              type="number"
              inputMode="numeric"
              step={unidad === "kg" ? "0.001" : "1"}
              ref={stockMinimoRef}
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              aria-invalid={Boolean(errors.stockMinimo)}
              aria-describedby={errors.stockMinimo ? "product-min-stock-error" : undefined}
              className="h-10 pointer-coarse:h-11 rounded-xl border-line px-4 text-base focus-visible:ring-2 focus-visible:ring-ring"
            />
            <FieldError id="product-min-stock-error">{errors.stockMinimo}</FieldError>
          </Field>
        </div>

        <Button fullWidth onClick={guardar} disabled={guardando}>
          {guardando && <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />}
          Guardar producto
        </Button>

        {!esNuevo && (
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setConfirmandoEliminar(true)}
            className="text-danger hover:text-danger hover:bg-danger-50"
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            Eliminar producto
          </Button>
        )}
      </Card>

      {escaneandoCodigo && (
        <BarcodeScanner
          onClose={() => setEscaneandoCodigo(false)}
          onCodigoDetectado={(codigo) => {
            setCodigoBarras((codigo || "").trim());
            setEscaneandoCodigo(false);
          }}
          mensaje="Código capturado, revisalo abajo y guardá el producto"
        />
      )}

      <AlertDialog open={confirmandoEliminar} onOpenChange={setConfirmandoEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{nombre}"?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={eliminando}
              onClick={(e) => {
                e.preventDefault();
                eliminar();
              }}
            >
              {eliminando && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
