import { Camera, Trash2 } from "lucide-react";
import { useState } from "react";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Header } from "../components/Header";
import { PrimaryButton } from "../components/PrimaryButton";
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
      typeof confirm === "undefined" || confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;
    deleteProduct(existente.id);
    pop();
  };

  return (
    <div>
      <Header title={esNuevo ? "Nuevo producto" : "Editar producto"} onBack={pop} />
      <div className="px-5 space-y-3 pb-6">
        <div>
          <label className="text-stone-500 text-sm block">
            Nombre
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
            />
          </label>
        </div>

        <div>
          <label className="text-stone-500 text-sm block">
            Código de barras (opcional)
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                placeholder="7791234567890"
                className="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3 outline-none text-stone-800 font-normal"
              />
              <button
                type="button"
                onClick={() => setEscaneandoCodigo(true)}
                className="shrink-0 rounded-2xl shadow-sm w-12 flex items-center justify-center"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4" }}
              >
                <Camera size={20} color="#2E6B4F" />
              </button>
            </div>
          </label>
          <p className="text-stone-400 text-xs mt-1">
            Mejor escanealo con la cámara que tipearlo: así queda idéntico al código que la caja va
            a leer después, sin errores de tipeo.
          </p>
        </div>

        <div>
          <label className="text-stone-500 text-sm block">
            Precio de venta
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
            />
          </label>
        </div>

        <div>
          <p className="text-stone-500 text-sm mb-2 block">Unidad de medida</p>
          <div className="flex gap-2">
            {["unidad", "kg"].map((u) => (
              <button
                type="button"
                key={u}
                disabled={!esNuevo}
                onClick={() => setUnidad(u)}
                className={
                  "flex-1 rounded-xl py-2.5 text-sm font-medium border" +
                  (!esNuevo ? " opacity-50" : "")
                }
                style={
                  unidad === u
                    ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                    : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                }
              >
                {u === "unidad" ? "Por unidad" : "Por peso (kg)"}
              </button>
            ))}
          </div>
          {!esNuevo && (
            <p className="text-stone-400 text-xs mt-1">
              La unidad de medida no se puede cambiar luego de creado.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-stone-500 text-sm block">
              Stock {esNuevo ? "inicial" : "actual"}
              <input
                type="number"
                step={unidad === "kg" ? "0.001" : "1"}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
              />
            </label>
          </div>
          <div>
            <label className="text-stone-500 text-sm block">
              Stock mínimo
              <input
                type="number"
                step={unidad === "kg" ? "0.001" : "1"}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800 font-normal"
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={guardar} disabled={!puedeGuardar}>
            Guardar producto
          </PrimaryButton>
        </div>

        {!esNuevo && (
          <button
            type="button"
            onClick={eliminar}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
            style={{ color: "#B91C1C" }}
          >
            <Trash2 size={16} />
            Eliminar producto
          </button>
        )}
      </div>

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
