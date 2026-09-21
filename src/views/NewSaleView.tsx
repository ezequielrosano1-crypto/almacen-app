import { Camera, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { BarcodeScannerCartPanel } from "../components/BarcodeScannerCartPanel";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { Header } from "../components/Header";
import { ProductRow } from "../components/ProductRow";
import { SaleCartFooter } from "../components/SaleCartFooter";
import { SearchBar } from "../components/SearchBar";
import { submitSale } from "../data/submitSale";
import { useSaleCart } from "../hooks/useSaleCart";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import type { PaymentMethod, Product } from "../types/domain";
import type { StoredCashShift } from "../types/storage";

export interface NewSaleViewProps {
  products?: Product[] | any[];
  productos?: Product[] | any[];
  setProducts?: (p: any) => void;
  recordStockMovement?: (m: any) => void;
  registrarMovimiento?: (m: any) => void;
  updateStock?: (id: any, delta: any) => void;
  actualizarStock?: (id: any, delta: any) => void;
  pop: () => void;
  resetStack: () => void;
  cashShift?: StoredCashShift | null;
  caja?: StoredCashShift | null;
}

export function NewSaleView(props: NewSaleViewProps) {
  const { pop, resetStack } = props;
  const products = (props.products ?? props.productos ?? []) as any[];
  const cashShift = props.cashShift ?? props.caja ?? null;

  const [busqueda, setBusqueda] = useState("");
  const [pago, setPago] = useState<PaymentMethod | string | null>(null);
  const [confirmada, setConfirmada] = useState<{ total: number; pago: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeEscaneo, setMensajeEscaneo] = useState<string | null>(null);
  const ultimoCodigoRef = useRef<string | null>(null);
  const cooldownCodigoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { items, total, agregarProducto, cambiarCantidad, quitarProducto } = useSaleCart(products);

  const disponibles = products
    .filter((p: any) => {
      const nombre = p.nombre ?? p.name ?? "";
      return nombre.toLowerCase().includes(busqueda.toLowerCase());
    })
    .sort((a: any, b: any) => {
      const nomA = a.nombre ?? a.name ?? "";
      const nomB = b.nombre ?? b.name ?? "";
      return nomA.localeCompare(nomB);
    });

  const manejarCodigoDetectado = (codigo: string) => {
    const limpio = (codigo || "").trim();
    if (!limpio || limpio === ultimoCodigoRef.current) return;
    ultimoCodigoRef.current = limpio;
    if (cooldownCodigoRef.current) clearTimeout(cooldownCodigoRef.current);
    cooldownCodigoRef.current = setTimeout(() => {
      ultimoCodigoRef.current = null;
    }, 1500);

    const producto = products.find((p: any) => {
      const cb = p.codigoBarras ?? p.barcode;
      return cb && cb.trim() === limpio;
    });

    if (producto) {
      agregarProducto(producto);
      setMensajeEscaneo(`Agregado: ${producto.nombre ?? producto.name}`);
    } else {
      setMensajeEscaneo("Código no asociado a ningún producto todavía.");
    }
    setTimeout(() => setMensajeEscaneo(null), 2500);
  };

  const confirmarVenta = async () => {
    if (items.length === 0 || !pago || enviando || !cashShift || cashShift.estado !== "ABIERTA")
      return;

    setEnviando(true);

    try {
      await submitSale({ total, pago: String(pago), items: items as any });
      setConfirmada({ total, pago: String(pago) });
    } catch (error) {
      console.error("Error registrando venta:", error);
      alert("No se pudo registrar la venta.");
    } finally {
      setEnviando(false);
    }
  };

  if (confirmada) {
    return (
      <ConfirmationScreen
        icon={<CheckCircle2 size={56} color={COLORS.principal} />}
        title="Venta registrada"
        message={`Total ${formatMoney(confirmada.total)} · ${confirmada.pago}`}
        buttonLabel="Volver a Ventas"
        onDone={resetStack}
      />
    );
  }

  if (!cashShift || cashShift.estado !== "ABIERTA") {
    return (
      <div className="px-5 pt-6">
        <Header title="Nueva venta" onBack={pop} />
        <div className="bg-white rounded-2xl shadow-sm px-5 py-6 text-center space-y-2">
          <p className="text-lg font-bold text-stone-800">Caja cerrada</p>
          <p className="text-sm text-stone-500">
            No se pueden registrar ventas fuera del horario de caja.
          </p>
          <p className="text-sm font-medium" style={{ color: COLORS.principal }}>
            Próxima apertura: 08:00
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-72">
      <Header title="Nueva venta" onBack={pop} />
      <div className="px-5 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
          </div>
          <button
            type="button"
            onClick={() => setEscaneando(true)}
            className="shrink-0 rounded-2xl shadow-sm w-12 flex items-center justify-center"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E7E5E4" }}
          >
            <Camera size={20} color="#2E6B4F" />
          </button>
        </div>
        <div className="space-y-2">
          {disponibles.length > 0 ? (
            disponibles.map((p: any) => (
              <ProductRow key={p.id} producto={p} onClick={() => agregarProducto(p)} />
            ))
          ) : (
            <p className="text-stone-400 text-xs text-center py-6">
              Ningún producto coincide con la búsqueda
            </p>
          )}
        </div>
      </div>

      <SaleCartFooter
        items={items}
        total={total}
        pago={pago}
        setPago={setPago}
        confirmarVenta={confirmarVenta}
        enviando={enviando}
        cambiarCantidad={cambiarCantidad}
        quitarProducto={quitarProducto}
      />

      {escaneando && (
        <BarcodeScanner
          onClose={() => setEscaneando(false)}
          onCodigoDetectado={manejarCodigoDetectado}
          mensaje={mensajeEscaneo}
        >
          <BarcodeScannerCartPanel
            items={items}
            total={total}
            pago={pago}
            setPago={setPago}
            onConfirmar={confirmarVenta}
            enviando={enviando}
          />
        </BarcodeScanner>
      )}
    </div>
  );
}
