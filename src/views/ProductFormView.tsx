import { Camera, Trash2 } from "lucide-react";
import { useState } from "react";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import type { ProductDraft } from "../hooks/useProducts";
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

const INPUT_CLASS =
  "w-full rounded-xl border border-line px-4 py-3 mt-1.5 outline-hidden text-ink focus:ring-2 focus:ring-brand focus:border-brand";

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

  const puedeGuardar = nombre && precio && stock !== "" && stockMinimo !== "";

  const guardar = () => {
    if (!puedeGuardar) return;
    const finalBarcode = codigoBarras.trim() ? codigoBarras.trim() : null;
    const nuevoProducto = {
      id: existente?.id,
      nombre,
      precio: parseFloat(precio),
      unidad,
      stock: parseFloat(stock),
      stockMinimo: parseFloat(stockMinimo),
      codigoBarras: finalBarcode,
    };
    saveProduct(nuevoProducto);
    pop();
  };

  const eliminar = () => {
    if (!existente) return;
    const confirmado =
      typeof confirm === "undefined" ||
      confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;
    deleteProduct(existente.id);
    pop();
  };

  return (
    <div className="pb-6 lg:max-w-2xl">
      <PageHeader title={esNuevo ? "Nuevo producto" : "Editar producto"} onBack={pop} />
      <Card className="space-y-4">
        <div>
          <label className="text-ink-soft text-sm font-medium block" htmlFor="product-name">
            Nombre
          </label>
          <input
            id="product-name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="text-ink-soft text-sm font-medium block" htmlFor="product-barcode">
            Código de barras (opcional)
          </label>
          <div className="flex gap-2 mt-1.5">
            <input
              id="product-barcode"
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="7791234567890"
              className="flex-1 rounded-xl border border-line px-4 py-3 outline-hidden text-ink focus:ring-2 focus:ring-brand focus:border-brand"
            />
            <button
              type="button"
              onClick={() => setEscaneandoCodigo(true)}
              className="shrink-0 rounded-xl border border-line bg-white w-12 flex items-center justify-center"
            >
              <Camera size={20} color="#0066FF" />
            </button>
          </div>
          <p className="text-ink-subtle text-xs mt-1.5">
            Mejor escanealo con la cámara que tipearlo: así queda idéntico al código que la caja va
            a leer después, sin errores de tipeo.
          </p>
        </div>

        <div>
          <label className="text-ink-soft text-sm font-medium block" htmlFor="product-price">
            Precio de venta
          </label>
          <input
            id="product-price"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <p className="text-ink-soft text-sm font-medium mb-2">Unidad de medida</p>
          <div className="flex gap-2">
            {["unidad", "kg"].map((u) => (
              <button
                type="button"
                key={u}
                disabled={!esNuevo}
                onClick={() => setUnidad(u)}
                className={[
                  "flex-1 rounded-xl py-2.5 text-sm font-medium border transition-colors",
                  !esNuevo ? "opacity-50" : "",
                  unidad === u
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-ink-soft border-line",
                ].join(" ")}
              >
                {u === "unidad" ? "Por unidad" : "Por peso (kg)"}
              </button>
            ))}
          </div>
          {!esNuevo && (
            <p className="text-ink-subtle text-xs mt-1.5">
              La unidad de medida no se puede cambiar luego de creado.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-ink-soft text-sm font-medium block" htmlFor="product-stock">
              Stock {esNuevo ? "inicial" : "actual"}
            </label>
            <input
              id="product-stock"
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="text-ink-soft text-sm font-medium block" htmlFor="product-min-stock">
              Stock mínimo
            </label>
            <input
              id="product-min-stock"
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <Button fullWidth onClick={guardar} disabled={!puedeGuardar}>
          Guardar producto
        </Button>

        {!esNuevo && (
          <button
            type="button"
            onClick={eliminar}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-danger"
          >
            <Trash2 size={16} />
            Eliminar producto
          </button>
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
    </div>
  );
}
