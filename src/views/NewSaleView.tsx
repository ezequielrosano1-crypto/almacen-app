import { Camera, CheckCircle2, Minus, Package, Plus, Trash2 } from "lucide-react";
import { type Dispatch, type SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { BarcodeScannerCartPanel } from "../components/BarcodeScannerCartPanel";
import { ConfirmationScreen } from "../components/ConfirmationScreen";
import { ProductRow } from "../components/ProductRow";
import { SaleCartFooter } from "../components/SaleCartFooter";
import { SearchBar } from "../components/SearchBar";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { PageHeader } from "../components/common/PageHeader";
import { Table, TableBody, TableCell, TableRow } from "../components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { type SubmitSaleCartItem, submitSale } from "../data/submitSale";
import type { ProductItem } from "../hooks/useProducts";
import { useSaleCart } from "../hooks/useSaleCart";
import type { StockMovementInput } from "../hooks/useStockMovements";
import { COLORS } from "../lib/constants";
import { formatMoney } from "../lib/format";
import type { PaymentMethod, ProductId } from "../types/domain";
import type { StoredCashShift } from "../types/storage";

export interface NewSaleViewProps {
  products: ProductItem[];
  setProducts: Dispatch<SetStateAction<ProductItem[]>>;
  recordStockMovement: (m: StockMovementInput) => Promise<unknown>;
  updateStock: (id: ProductId, newStock: number) => Promise<boolean>;
  pop: () => void;
  resetStack: () => void;
  cashShift: StoredCashShift | null;
}

const PAYMENT_METHODS: PaymentMethod[] = ["Efectivo", "Débito"];

export function NewSaleView(props: NewSaleViewProps) {
  const { pop, resetStack } = props;
  const { products, cashShift } = props;

  const [busqueda, setBusqueda] = useState("");
  const [pago, setPago] = useState<PaymentMethod | string | null>(null);
  const [confirmada, setConfirmada] = useState<{ total: number; pago: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeEscaneo, setMensajeEscaneo] = useState<string | null>(null);
  const ultimoCodigoRef = useRef<string | null>(null);
  const cooldownCodigoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { items, total, agregarProducto, cambiarCantidad, quitarProducto, limpiarCarrito } =
    useSaleCart(products);

  const disponibles = products
    .filter((p) => {
      const nombre = p.nombre ?? p.name ?? "";
      return nombre.toLowerCase().includes(busqueda.toLowerCase());
    })
    .sort((a, b) => {
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

    const producto = products.find((p) => {
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
      // Los items del carrito guardan `producto` sin tipar; en runtime son los productos del estado.
      await submitSale({
        total,
        pago: String(pago),
        items: items as unknown as SubmitSaleCartItem[],
      });
      setConfirmada({ total, pago: String(pago) });
    } catch (error) {
      console.error("Error registrando venta:", error);
      toast.error("No se pudo registrar la venta.", { duration: Infinity });
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

  if (cashShift?.estado !== "ABIERTA") {
    return (
      <div className="pb-4">
        <PageHeader title="Nueva venta" onBack={pop} />
        <Card className="text-center space-y-2 py-6">
          <p className="text-lg font-bold text-ink">Caja cerrada</p>
          <p className="text-sm text-ink-muted">
            No se pueden registrar ventas fuera del horario de caja.
          </p>
          <p className="text-sm font-medium" style={{ color: COLORS.principal }}>
            Próxima apertura: 08:00
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-72 lg:pb-4">
      <PageHeader
        title="Nueva venta"
        subtitle="Buscá productos, escaneá códigos o agregá manualmente."
        onBack={pop}
        action={
          <Button variant="secondary" icon={Camera} onClick={() => setEscaneando(true)}>
            Escanear código
          </Button>
        }
      />

      <div className="lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start">
        <div className="lg:col-span-2 space-y-3">
          <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />

          {/* Desktop product grid */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-3">
            {disponibles.length > 0 ? (
              disponibles.map((p) => {
                const nombre = p.nombre ?? p.name ?? "";
                const precio = p.precio ?? p.price ?? 0;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-white p-3 text-left hover:border-brand transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                      <Package size={18} color="#0066FF" />
                    </div>
                    <p className="text-sm font-medium text-ink line-clamp-2">{nombre}</p>
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold text-ink-soft">
                        {formatMoney(precio)}
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                        <Plus size={14} />
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-ink-subtle text-sm col-span-full text-center py-6">
                Ningún producto coincide con la búsqueda
              </p>
            )}
          </div>

          {/* Mobile product list */}
          <div className="lg:hidden space-y-2">
            {disponibles.length > 0 ? (
              disponibles.map((p) => (
                <ProductRow key={p.id} producto={p} onClick={() => agregarProducto(p)} />
              ))
            ) : (
              <p className="text-ink-subtle text-xs text-center py-6">
                Ningún producto coincide con la búsqueda
              </p>
            )}
          </div>

          {/* Desktop cart table */}
          <Card className="hidden lg:block">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-semibold text-ink">
                Productos en venta ({items.length})
              </p>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarCarrito}
                  className="text-danger hover:text-danger hover:bg-danger-50"
                >
                  Limpiar
                </Button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-ink-subtle text-sm py-6 text-center">
                Todavía no agregaste productos a la venta.
              </p>
            ) : (
              <Table>
                <TableBody>
                  {items.map((it) => {
                    const prod = it.producto as
                      | { nombre?: string; name?: string; unidad?: string; unit?: string }
                      | undefined;
                    const name = prod?.nombre ?? prod?.name ?? "";
                    const unit = prod?.unidad ?? prod?.unit;
                    return (
                      <TableRow key={it.id} className="border-line-soft">
                        <TableCell className="py-2.5 pr-3 font-medium text-ink whitespace-normal">
                          {name}
                        </TableCell>
                        <TableCell className="py-2.5 pr-3 text-ink-soft">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              static
                              onClick={() => cambiarCantidad(it.id, -1)}
                              aria-label={`Restar unidad de ${name}`}
                              className="h-8 w-8 p-0 rounded-full bg-line-soft"
                            >
                              <Minus size={14} strokeWidth={2} aria-hidden="true" />
                            </Button>
                            <span className="w-10 text-center tabular-nums">
                              {it.cantidad}
                              {unit === "kg" ? "kg" : ""}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              static
                              onClick={() => cambiarCantidad(it.id, 1)}
                              aria-label={`Sumar unidad de ${name}`}
                              className="h-8 w-8 p-0 rounded-full bg-line-soft"
                            >
                              <Plus size={14} strokeWidth={2} aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 pr-3 text-right font-semibold text-ink tabular-nums">
                          {formatMoney(it.subtotal)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            static
                            onClick={() => quitarProducto(it.id)}
                            className="h-8 w-8 p-0 text-ink-subtle"
                            aria-label={`Quitar ${name} de la venta`}
                          >
                            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Desktop sticky payment panel */}
        <div className="hidden lg:block">
          <Card className="sticky top-6 space-y-4">
            <div>
              <p className="text-sm text-ink-muted">Total de la venta</p>
              <p className="font-display text-3xl font-bold text-ink mt-1">{formatMoney(total)}</p>
            </div>
            <div>
              <p id="payment-method-label" className="text-sm font-medium text-ink-soft mb-2">
                Método de pago
              </p>
              <ToggleGroup
                type="single"
                spacing={2}
                value={pago ?? ""}
                onValueChange={(next) => {
                  if (next) setPago(next);
                }}
                aria-labelledby="payment-method-label"
                className="grid grid-cols-2 gap-2 w-full"
              >
                {PAYMENT_METHODS.map((m) => (
                  <ToggleGroupItem
                    key={m}
                    value={m}
                    className="h-10 pointer-coarse:h-11 rounded-xl text-sm font-semibold border border-line data-[state=on]:bg-brand data-[state=on]:text-white data-[state=on]:border-brand data-[state=off]:bg-white data-[state=off]:text-ink-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {m}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <Button
              fullWidth
              onClick={confirmarVenta}
              disabled={items.length === 0 || !pago || enviando}
            >
              Cobrar venta
            </Button>
          </Card>
        </div>
      </div>

      {/* Mobile fixed cart footer */}
      <div className="lg:hidden">
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
      </div>

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
