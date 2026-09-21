import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  Camera,
} from "lucide-react";
import { supabase } from "./data/supabaseClient";
import {
  COLORS,
  ADJUSTMENT_REASONS,
  CASH_SHIFT_STORAGE_KEY,
  TEST_CASH_SHIFT_STORAGE_KEY,
} from "./lib/constants";
import { formatMoney, formatDate } from "./lib/format";
import { formatStock, getProductStatus, getStatusColor } from "./lib/stock";
import { nextId } from "./lib/ids";
import { initialProducts, initialStockMovements } from "./lib/initialData";
import {
  isToday,
  todayDateKey,
  localDateKey,
  nowInUruguay,
  formatUruguayTime,
} from "./lib/dates";
import {
  getTodaySales,
  getTodayTotal,
  getTodayCashTotal,
  getTodayDebitTotal,
  getTodayProductsSold,
  getLowStockProducts,
  getOutOfStockProducts,
  getWeekSales,
} from "./lib/metrics";
import { readJson, writeJson, listKeys, removeKey } from "./lib/storage/storage";
import { toProductUpsert } from "./data/mappers";
import {
  listProducts,
  updateProductStock,
  upsertProduct,
} from "./data/productsRepository";
import {
  createSale,
  insertSaleItems,
  deleteSale,
  listSalesWithItems,
  listSaleItems,
} from "./data/salesRepository";
import { insertStockEntry } from "./data/stockMovementsRepository";
import {
  closeShiftManually,
} from "./data/cashShiftRepository";
import { syncCashShift } from "./data/cashShiftSync";
import { useCashRegister } from "./hooks/useCashRegister";
import { Header } from "./components/Header";
import { PrimaryButton } from "./components/PrimaryButton";
import { Row } from "./components/Row";
import { SearchBar } from "./components/SearchBar";
import { StatusDot } from "./components/StatusDot";
import { BottomNav } from "./components/BottomNav";
import { CashRegisterStatusCard as EstadoCajaCard } from "./components/CashRegisterStatusCard";
import { ConfirmationScreen } from "./components/ConfirmationScreen";
import { ProductList as ListaProductos } from "./components/ProductList";
import { ProductRow as ProductoListRow } from "./components/ProductRow";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { BarcodeScannerCartPanel } from "./components/BarcodeScannerCartPanel";

// ===========================================================================
// Constantes / configuración
// ===========================================================================



// ===========================================================================
// Datos iniciales (mock) — en estado local de React, listos para reemplazarse
// por una fuente de datos real más adelante sin cambiar la interfaz.
// ===========================================================================








// ===========================================================================
// INICIO — sin estado propio, recibe todo por props
// ===========================================================================
function PantallaInicio({
  totalHoy,
  efectivoHoy,
  debitoHoy,
  productosVendidosHoy,
  productosBajo,
  productosAgotados,
  goTabScreen,
  caja,
}) {
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <div>
        <p className="text-stone-500 text-sm">Hoy</p>
        <h1 className="text-2xl font-bold text-stone-800">Resumen del día</h1>
      </div>

      <EstadoCajaCard caja={caja} totalHoy={totalHoy} />

      <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
        <p className="text-stone-500 text-sm mb-1">Ventas de hoy</p>
        <p className="text-4xl font-bold mb-4" style={{ color: "#2E6B4F" }}>{formatMoney(totalHoy)}</p>
        <div className="flex justify-between text-sm text-stone-600 border-t border-stone-100 pt-3">
          <span>
            Efectivo: <strong className="text-stone-800">{formatMoney(efectivoHoy)}</strong>
          </span>
          <span>
            Débito: <strong className="text-stone-800">{formatMoney(debitoHoy)}</strong>
          </span>
        </div>
        <p className="text-sm text-stone-500 mt-2">{productosVendidosHoy} productos vendidos</p>
      </div>

      {(productosBajo.length > 0 || productosAgotados.length > 0) && (
        <div className="space-y-2">
          {productosAgotados.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "lowStock")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <XCircle size={22} color={COLORS.agotado} />
              <span className="text-stone-700 text-sm">
                <strong style={{ color: COLORS.agotado }}>{productosAgotados.length}</strong> productos agotados
              </span>
            </button>
          )}
          {productosBajo.length > 0 && (
            <button
              type="button"
              onClick={() => goTabScreen("stock", "lowStock")}
              className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm px-4 py-3 text-left"
            >
              <AlertTriangle size={22} color={COLORS.bajo} />
              <span className="text-stone-700 text-sm">
                <strong style={{ color: COLORS.bajo }}>{productosBajo.length}</strong> productos con stock bajo
              </span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => goTabScreen("sales", "newSale")}
          className="w-full font-semibold rounded-2xl py-4 text-lg shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: "#2E6B4F", color: "#FFFFFF" }}
        >
          <Plus size={22} />
          Nueva venta
        </button>
        <button
          type="button"
          onClick={() => goTabScreen("stock", "addStockEntry")}
          className="w-full font-semibold rounded-2xl py-3.5 text-base shadow-sm border flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
        >
          <Plus size={20} />
          Agregar entrada
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// VENTAS
// ===========================================================================
function VentasMain({ push, caja, totalHoy, abrirCajaManual }) {
  const [avisoFueraHorario, setAvisoFueraHorario] = useState(false);
  const [abriendo, setAbriendo] = useState(false);

  const tocarAbrir = async () => {
    setAbriendo(true);
    const resultado = await abrirCajaManual();
    setAbriendo(false);
    if (!resultado) {
      setAvisoFueraHorario(true);
      setTimeout(() => setAvisoFueraHorario(false), 3500);
    }
  };

  return (
    <div>
      <Header title="Ventas" />
      <div className="px-5 space-y-3">
        <EstadoCajaCard caja={caja} totalHoy={totalHoy} />
        {caja?.estado !== "ABIERTA" && (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={tocarAbrir}
              disabled={abriendo}
              className="w-full font-semibold rounded-2xl py-3 text-sm shadow-sm border flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
            >
              Abrir caja ahora (manual)
            </button>
            {avisoFueraHorario && (
              <p className="text-xs text-center" style={{ color: COLORS.agotado }}>
                Solo se puede abrir manualmente entre 08:00 y 22:00.
              </p>
            )}
          </div>
        )}
        <Row label="Nueva venta" onClick={() => push("newSale")} />
        <Row label="Cierre del día" onClick={() => push("dayClosing")} />
        <Row label="Historial de cierres" onClick={() => push("closingHistory")} />
      </div>
    </div>
  );
}

function NuevaVenta({ productos, setProductos, registrarMovimiento, actualizarStock, pop, resetStack, caja }) {
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState([]); // [{id, cantidad}]
  const [pago, setPago] = useState(null);
  const [confirmada, setConfirmada] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeEscaneo, setMensajeEscaneo] = useState(null);
  const ultimoCodigoRef = useRef(null);
  const cooldownCodigoRef = useRef(null);

  const disponibles = productos
    .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const cantidadEnCarrito = (id) => carrito.find((c) => c.id === id)?.cantidad || 0;

  const agregarProducto = (producto) => {
    const enCarrito = cantidadEnCarrito(producto.id);
    const incremento = producto.unidad === "kg" ? 0.5 : 1;
    if (enCarrito + incremento > producto.stock) return;
    if (enCarrito === 0) {
      setCarrito((c) => [...c, { id: producto.id, cantidad: incremento }]);
    } else {
      setCarrito((c) =>
        c.map((it) => (it.id === producto.id ? { ...it, cantidad: it.cantidad + incremento } : it))
      );
    }
  };

  const manejarCodigoDetectado = (codigo) => {
    const limpio = (codigo || "").trim();
    if (!limpio || limpio === ultimoCodigoRef.current) return;
    ultimoCodigoRef.current = limpio;
    // Después de un ratito se "olvida" el último código leído, para poder
    // escanear el MISMO producto de nuevo (por ejemplo, si el cliente lleva
    // 2 unidades). Sin esto, una vez leído un código quedaba bloqueado para
    // siempre en esta pantalla.
    if (cooldownCodigoRef.current) clearTimeout(cooldownCodigoRef.current);
    cooldownCodigoRef.current = setTimeout(() => {
      ultimoCodigoRef.current = null;
    }, 1500);

    const producto = productos.find((p) => p.codigoBarras && p.codigoBarras.trim() === limpio);
    if (producto) {
      agregarProducto(producto);
      setMensajeEscaneo(`Agregado: ${producto.nombre}`);
    } else {
      setMensajeEscaneo("Código no asociado a ningún producto todavía.");
    }
    setTimeout(() => setMensajeEscaneo(null), 2500);
  };

  const cambiarCantidad = (id, delta) => {
    const producto = productos.find((p) => p.id === id);
    const paso = producto.unidad === "kg" ? 0.5 : 1;
    setCarrito((c) =>
      c
        .map((it) => {
          if (it.id !== id) return it;
          const nueva = Math.round((it.cantidad + delta * paso) * 100) / 100;
          return { ...it, cantidad: nueva };
        })
        .filter((it) => it.cantidad > 0 && it.cantidad <= producto.stock)
    );
  };

  const quitarProducto = (id) => setCarrito((c) => c.filter((it) => it.id !== id));

  const items = carrito.map((it) => {
    const producto = productos.find((p) => p.id === it.id);
    return { ...it, producto, subtotal: producto.precio * it.cantidad };
  });
  const total = items.reduce((a, it) => a + it.subtotal, 0);

 const confirmarVenta = async () => {
  if (items.length === 0 || !pago || enviando || !caja || caja.estado !== "ABIERTA") return;

  setEnviando(true);

  try {
    const venta = await createSale({
      negocio_id: 1,
      jornada_id: null,
      fecha: new Date().toISOString(),
      total: Number(total),
      pago,
    });

    const itemsVenta = items.map((it) => ({
      venta_id: venta.id,
      producto_id: it.producto.id,
      nombre: it.producto.nombre,
      cantidad: Number(it.cantidad),
      unidad: it.producto.unidad,
      precio_unitario: Number(it.producto.precio),
      subtotal: Number(it.subtotal),
    }));

    try {
      await insertSaleItems(itemsVenta);
    } catch (errorItems) {
      await deleteSale(venta.id);
      throw errorItems;
    }

    for (const it of items) {
      const nuevoStock =
        Math.round((it.producto.stock - it.cantidad) * 100) / 100;
      await updateProductStock(it.producto.id, nuevoStock);
    }

 

    setConfirmada({ total, pago });
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

  if (!caja || caja.estado !== "ABIERTA") {
    return (
      <div className="px-5 pt-6">
        <Header title="Nueva venta" onBack={pop} />
        <div className="bg-white rounded-2xl shadow-sm px-5 py-6 text-center space-y-2">
          <p className="text-lg font-bold text-stone-800">Caja cerrada</p>
          <p className="text-sm text-stone-500">No se pueden registrar ventas fuera del horario de caja.</p>
          <p className="text-sm font-medium" style={{ color: COLORS.principal }}>Próxima apertura: 08:00</p>
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
            disponibles.map((p) => (
              <ProductoListRow key={p.id} producto={p} onClick={() => agregarProducto(p)} />
            ))
          ) : (
            <p className="text-stone-400 text-xs text-center py-6">Ningún producto coincide con la búsqueda</p>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-stone-200 max-w-sm mx-auto flex flex-col">
          {/* Zona con scroll propio: SOLO la lista de productos del carrito */}
          <div className="px-5 pt-3 space-y-2 max-h-40 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <p className="text-stone-800 font-medium">{it.producto.nombre}</p>
                  <p className="text-stone-400 text-xs">{formatMoney(it.subtotal)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cambiarCantidad(it.id, -1)} className="p-1 bg-stone-100 rounded-full">
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-stone-700">
                    {it.cantidad}
                    {it.producto.unidad === "kg" ? "kg" : ""}
                  </span>
                  <button type="button" onClick={() => cambiarCantidad(it.id, 1)} className="p-1 bg-stone-100 rounded-full">
                    <Plus size={14} />
                  </button>
                  <button type="button" onClick={() => quitarProducto(it.id)} className="p-1 text-stone-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Zona fija: Total, medio de pago y Confirmar venta — nunca dentro del scroll */}
          <div className="px-5 pt-2 pb-4 space-y-2 border-t border-stone-100 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 text-sm">Total</span>
              <span className="text-xl font-bold" style={{ color: "#2E6B4F" }}>{formatMoney(total)}</span>
            </div>

            <div className="flex gap-2">
              {["Efectivo", "Débito"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPago(m)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold border"
                  style={
                    pago === m
                      ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                      : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
                  }
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <PrimaryButton onClick={confirmarVenta} disabled={!pago || enviando}>
                Confirmar venta
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

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

function CierreDia({ totalHoy, efectivoHoy, debitoHoy, ventasHoy, pop, caja, actualizarCaja }) {
  const claveHoy = `cierre:${todayDateKey()}`;
  const [cargando, setCargando] = useState(true);
  const [cierre, setCierre] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const guardado = await readJson(claveHoy);
        if (activo && guardado) {
          setCierre(guardado);
        }
      } catch (e) {
        // Todavía no existe un cierre guardado para hoy: se mantiene cierre en null
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [claveHoy]);

  const confirmarCierre = async () => {
    if (guardando || cierre) return;
    setGuardando(true);
    setErrorGuardado(false);
    const registro = {
      fecha: todayDateKey(),
      hora: formatUruguayTime(),
      total: totalHoy,
      cantidadVentas: ventasHoy.length,
    };
    try {
  if (!caja?.id) {
    throw new Error("No hay una jornada de caja activa.");
  }

    await closeShiftManually(caja.id, {
      estado: "CERRADA",
      hora_cierre: registro.hora,
      cerrado_automatico: false,
      total: Number(registro.total),
      cantidad_ventas: Number(registro.cantidadVentas),
      updated_at: new Date().toISOString(),
    });

  const cerrada = {
    ...(caja || {}),
    id: caja.id,
    fecha: todayDateKey(),
    estado: "CERRADA",
    horaCierre: registro.hora,
    cerradoAutomaticamente: false,
    total: Number(registro.total),
    cantidadVentas: Number(registro.cantidadVentas),
  };

  if (actualizarCaja) actualizarCaja(cerrada);
  setCierre(registro);
  setConfirmando(false);
   
 } catch (e) {
  console.error("Error guardando cierre de jornada:", e);
  setErrorGuardado(true);
} finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-5 space-y-3">
      <Header title="Cierre del día" onBack={pop} />
      <EstadoCajaCard caja={caja} totalHoy={totalHoy} />
      <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-stone-500 text-sm">Total del día</span>
          <span className="text-xl font-bold" style={{ color: "#2E6B4F" }}>{formatMoney(totalHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Efectivo</span>
          <span className="text-stone-800 font-medium">{formatMoney(efectivoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Débito</span>
          <span className="text-stone-800 font-medium">{formatMoney(debitoHoy)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
          <span className="text-stone-500">Cantidad de ventas</span>
          <span className="text-stone-800 font-medium">{ventasHoy.length}</span>
        </div>
      </div>

      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-3">Verificando el estado del día...</p>
      ) : cierre ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-2">
          <p className="text-sm font-semibold" style={{ color: "#2E6B4F" }}>
            Día cerrado
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{cierre.fecha}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Hora de cierre</span>
            <span className="text-stone-800 font-medium">{cierre.hora}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Total cerrado</span>
            <span className="text-stone-800 font-medium">{formatMoney(cierre.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Cantidad de ventas</span>
            <span className="text-stone-800 font-medium">{cierre.cantidadVentas}</span>
          </div>
        </div>
      ) : confirmando ? (
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <p className="text-stone-700 text-sm text-center">
            ¿Confirmás el cierre del día? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-2xl py-3 text-sm font-semibold border"
              style={{ backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }}
            >
              Cancelar
            </button>
            <PrimaryButton onClick={confirmarCierre} disabled={guardando}>
              Confirmar cierre
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div>
          <PrimaryButton onClick={() => setConfirmando(true)}>Cerrar día</PrimaryButton>
          {errorGuardado && (
            <p className="text-xs text-center mt-2" style={{ color: "#C0392B" }}>
              No se pudo guardar el cierre. Intentá nuevamente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// STOCK
// ===========================================================================
function HistorialCierres({ pop }) {
  const [cargando, setCargando] = useState(true);
  const [cierres, setCierres] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        // Recorre todas las claves "cierre:YYYY-MM-DD" guardadas (una por
        // cada día cerrado, manual o automáticamente) y trae cada resumen.
        const listado = await listKeys("cierre:");
        const claves = (listado || []).slice().sort().reverse();
        const registros = [];
        for (const clave of claves) {
          try {
            const data = await readJson(clave);
            if (data) registros.push(data);
          } catch (e) {}
        }
        if (activo) setCierres(registros);
      } catch (e) {
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  return (
    <div className="px-5 space-y-3 pb-6">
      <Header title="Historial de cierres" onBack={pop} />
      {cargando ? (
        <p className="text-stone-400 text-sm text-center py-6">Cargando historial...</p>
      ) : error ? (
        <p className="text-stone-400 text-sm text-center py-6">No se pudo cargar el historial.</p>
      ) : cierres.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6">Todavía no hay ningún día cerrado.</p>
      ) : (
        <div className="space-y-2">
          {cierres.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-800">{c.fecha}</p>
                <span
                  className="text-xs font-medium"
                  style={{ color: c.automatico ? COLORS.bajo : COLORS.principal }}
                >
                  {c.automatico ? "Cierre automático" : "Cierre manual"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Hora de cierre</span>
                <span className="text-stone-800 font-medium">{c.hora}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-medium">{formatMoney(c.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad de ventas</span>
                <span className="text-stone-800 font-medium">{c.cantidadVentas}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockMain({ push }) {
  return (
    <div>
      <Header title="Stock" />
      <div className="px-5 space-y-3">
        <Row label="Ver productos" onClick={() => push("productCatalog")} />
        <Row label="Stock bajo" onClick={() => push("lowStock")} />
        <Row label="Agregar entrada" onClick={() => push("addStockEntry")} />
        <Row label="Ajustar stock" onClick={() => push("adjustStock")} />
      </div>
    </div>
  );
}



function VerProductos({ productos, pop, onOpenDetalle }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <Header title="Ver productos" onBack={pop} />
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ListaProductos productos={productos} busqueda={busqueda} onProductoClick={onOpenDetalle} />
      </div>
    </div>
  );
}

function DetalleProducto({ productos, productoId, pop, goTabScreen }) {
  const p = productos.find((pr) => pr.id === productoId);
  if (!p) return null;
  const estado = getProductStatus(p);
  const etiqueta = estado === "agotado" ? "Agotado" : estado === "bajo" ? "Stock bajo" : "Normal";

  return (
    <div>
      <Header title={p.nombre} onBack={pop} />
      <div className="px-5 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Precio</span>
            <span className="text-stone-800 font-medium">{formatMoney(p.precio)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Stock actual</span>
            <span className="text-stone-800 font-medium">{formatStock(p)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Stock mínimo</span>
            <span className="text-stone-800 font-medium">
              {p.stockMinimo} {p.unidad === "kg" ? "kg" : "un."}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-stone-100 pt-3">
            <span className="text-stone-500">Estado</span>
            <span className="flex items-center gap-2 font-medium" style={{ color: getStatusColor(estado) }}>
              <StatusDot estado={estado} />
              {etiqueta}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => goTabScreen("stock", "addStockEntry", { productId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
          >
            Agregar entrada
          </button>
          <button
            type="button"
            onClick={() => goTabScreen("stock", "adjustStock", { productId: p.id })}
            className="font-semibold rounded-2xl py-3 text-sm shadow-sm border"
            style={{ backgroundColor: "#FFFFFF", color: "#2E6B4F", borderColor: "#2E6B4F33" }}
          >
            Ajustar stock
          </button>
        </div>
      </div>
    </div>
  );
}

function StockBajo({ productosAgotados, productosBajo, pop, onOpenDetalle }) {
  const lista = [...productosAgotados, ...productosBajo];
  return (
    <div>
      <Header title="Stock bajo" onBack={pop} />
      <div className="px-5 space-y-2">
        {lista.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-6">No hay productos para revisar</p>
        )}
        {lista.map((p) => {
          const estado = getProductStatus(p);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onOpenDetalle(p.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <StatusDot estado={estado} />
                <div>
                  <p className="text-stone-800 font-medium text-sm">{p.nombre}</p>
                  <p className="text-stone-400 text-xs">
                    Actual: {formatStock(p)} · Mínimo: {p.stockMinimo} {p.unidad === "kg" ? "kg" : "un."}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} color="#B8B2A5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgregarEntrada({ productos, productoIdInicial, actualizarStock, registrarMovimiento, pop, resetStack }) {
  const [productoId, setProductoId] = useState(productoIdInicial || null);
  const [busqueda, setBusqueda] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [confirmada, setConfirmada] = useState(null);

  const producto = productos.find((p) => p.id === productoId);
  const disponibles = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const confirmar = () => {
    const cant = parseFloat(cantidad);
    if (!producto || !cant || cant <= 0) return;
    const nuevoStock = Math.round((producto.stock + cant) * 100) / 100;
    actualizarStock(producto.id, nuevoStock);
  registrarMovimiento({
  tipo: "entrada",
  productoId: producto.id,
  producto: producto.nombre,
  cantidad: cant,
  unidad: producto.unidad,
});
    setConfirmada({ nombre: producto.nombre, cantidad: cant, unidad: producto.unidad });
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

  return (
    <div>
      <Header title="Agregar entrada" onBack={pop} />
      <div className="px-5 space-y-3">
        {!producto ? (
          <>
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
            <div className="space-y-2">
              {disponibles.map((p) => (
                <ProductoListRow key={p.id} producto={p} onClick={() => setProductoId(p.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-stone-800 font-medium text-sm">{producto.nombre}</p>
                <p className="text-stone-400 text-xs">Stock actual: {formatStock(producto)}</p>
              </div>
              <button type="button" onClick={() => setProductoId(null)} className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
                Cambiar
              </button>
            </div>
            <div>
              <label className="text-stone-500 text-sm">
                Cantidad a ingresar {producto.unidad === "kg" ? "(kg)" : "(unidades)"}
              </label>
              <input
                type="number"
                step={producto.unidad === "kg" ? "0.001" : "1"}
                min="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={producto.unidad === "kg" ? "0,500" : "0"}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
              />
            </div>
            <PrimaryButton onClick={confirmar} disabled={!cantidad || parseFloat(cantidad) <= 0}>
              Registrar entrada
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function AjustarStock({ productos, productoIdInicial, actualizarStock, registrarMovimiento, pop, resetStack }) {
  const [productoId, setProductoId] = useState(productoIdInicial || null);
  const [busqueda, setBusqueda] = useState("");
  const [stockReal, setStockReal] = useState("");
  const [motivo, setMotivo] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  const producto = productos.find((p) => p.id === productoId);
  const disponibles = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const confirmar = () => {
    const real = parseFloat(stockReal);
    if (!producto || isNaN(real) || real < 0 || !motivo) return;
    const diferencia = Math.round((real - producto.stock) * 100) / 100;
    actualizarStock(producto.id, real);
    registrarMovimiento({ tipo: "ajuste", producto: producto.nombre, diferencia, motivo });
    setConfirmada({ nombre: producto.nombre, diferencia });
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

  return (
    <div>
      <Header title="Ajustar stock" onBack={pop} />
      <div className="px-5 space-y-3">
        {!producto ? (
          <>
            <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
            <div className="space-y-2">
              {disponibles.map((p) => (
                <ProductoListRow key={p.id} producto={p} onClick={() => setProductoId(p.id)} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-stone-800 font-medium text-sm">{producto.nombre}</p>
                <p className="text-stone-400 text-xs">Stock registrado: {formatStock(producto)}</p>
              </div>
              <button type="button" onClick={() => setProductoId(null)} className="text-sm font-medium" style={{ color: "#2E6B4F" }}>
                Cambiar
              </button>
            </div>
            <div>
              <label className="text-stone-500 text-sm">Stock real contado</label>
              <input
                type="number"
                step={producto.unidad === "kg" ? "0.001" : "1"}
                min="0"
                value={stockReal}
                onChange={(e) => setStockReal(e.target.value)}
                className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
              />
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-2 block">Motivo del ajuste</label>
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

// ===========================================================================
// MOVIMIENTOS
// ===========================================================================
function Movimientos({ movimientos, onOpenDetalle }) {
  const [filtro, setFiltro] = useState("Todos");
  const filtros = ["Todos", "Ventas", "Entradas", "Ajustes"];
  const tipoDeFiltro = { Ventas: "venta", Entradas: "entrada", Ajustes: "ajuste" };

  const lista = movimientos.filter((m) => filtro === "Todos" || m.tipo === tipoDeFiltro[filtro]);

  const resumenMovimiento = (m) => {
    if (m.tipo === "venta") return `Venta · ${formatMoney(m.total)}`;
    if (m.tipo === "entrada") return `Entrada · ${m.producto}`;
    return `Ajuste · ${m.producto}`;
  };
  const colorTipo = (tipo) =>
    tipo === "venta" ? COLORS.principal : tipo === "entrada" ? "#5B7DB1" : COLORS.bajo;

  return (
    <div>
      <Header title="Movimientos" />
      <div className="px-5 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {filtros.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFiltro(f)}
              className="whitespace-nowrap text-sm rounded-full px-3.5 py-1.5 border"
              style={
                filtro === f
                  ? { backgroundColor: "#2E6B4F", color: "#FFFFFF", borderColor: "#2E6B4F" }
                  : { backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {lista.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm px-4 py-6 text-center text-stone-400 text-sm">
              Todavía no hay movimientos registrados
            </div>
          )}
          {lista.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onOpenDetalle(m.id)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colorTipo(m.tipo) }}
                />
                <div>
                  <p className="text-stone-800 font-medium text-sm">{resumenMovimiento(m)}</p>
                  <p className="text-stone-400 text-xs">{formatDate(m.fecha)}</p>
                </div>
              </div>
              <ChevronRight size={18} color="#B8B2A5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetalleMovimiento({ movimientos, movimientoId, pop }) {
  const m = movimientos.find((mv) => mv.id === movimientoId);
  if (!m) return null;

  return (
    <div>
      <Header title="Detalle del movimiento" onBack={pop} />
      <div className="px-5">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Fecha</span>
            <span className="text-stone-800 font-medium">{formatDate(m.fecha)}</span>
          </div>

          {m.tipo === "venta" && (
            <>
              <div className="border-t border-stone-100 pt-3 space-y-1">
                {m.items.map((it, i) => (
                  <div key={it.nombre + i} className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      {it.nombre} × {it.cantidad}
                      {it.unidad === "kg" ? "kg" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Total</span>
                <span className="text-stone-800 font-bold">{formatMoney(m.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Medio de pago</span>
                <span className="text-stone-800 font-medium">{m.pago}</span>
              </div>
            </>
          )}

          {m.tipo === "entrada" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{m.producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Cantidad</span>
                <span className="text-stone-800 font-medium">
                  +{m.cantidad}
                  {m.unidad === "kg" ? "kg" : " un."}
                </span>
              </div>
            </>
          )}

          {m.tipo === "ajuste" && (
            <>
              <div className="flex justify-between text-sm border-t border-stone-100 pt-3">
                <span className="text-stone-500">Producto</span>
                <span className="text-stone-800 font-medium">{m.producto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Diferencia</span>
                <span className="text-stone-800 font-medium">
                  {m.diferencia > 0 ? "+" : ""}
                  {m.diferencia}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Motivo</span>
                <span className="text-stone-800 font-medium">{m.motivo}</span>
              </div>
            </>
          )}
        </div>
        <p className="text-stone-400 text-xs text-center mt-4">
          Los movimientos son de solo lectura y no pueden editarse ni borrarse.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// MÁS
// ===========================================================================
function MasMain({ push }) {
  return (
    <div>
      <Header title="Más" />
      <div className="px-5 space-y-3">
        <Row label="Productos" onClick={() => push("products")} />
        <Row label="Información del negocio" onClick={() => push("businessInfo")} />
        <Row label="Configuración" onClick={() => push("settings")} />
      </div>
    </div>
  );
}

function ProductosMain({ productos, pop, onOpenDetalle, onNuevo }) {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={pop} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#57534E" />
          </button>
          <h1 className="text-2xl font-bold text-stone-800">Productos</h1>
        </div>
        <button type="button" onClick={onNuevo} className="rounded-full p-2" style={{ backgroundColor: "#2E6B4F" }}>
          <Plus size={20} color="white" />
        </button>
      </div>
      <div className="px-5 space-y-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar producto..." />
        <ListaProductos productos={productos} busqueda={busqueda} onProductoClick={onOpenDetalle} />
      </div>
    </div>
  );
}

function FormularioProducto({ productos, productoId, guardarProducto, pop }) {
  const existente = productos.find((p) => p.id === productoId);
  const esNuevo = !existente;
  const [nombre, setNombre] = useState(existente?.nombre || "");
  const [precio, setPrecio] = useState(existente ? String(existente.precio) : "");
  const [unidad, setUnidad] = useState(existente?.unidad || "unidad");
  const [stock, setStock] = useState(existente ? String(existente.stock) : "");
  const [stockMinimo, setStockMinimo] = useState(existente ? String(existente.stockMinimo) : "");
  const [codigoBarras, setCodigoBarras] = useState(existente?.codigoBarras || "");
  const [escaneandoCodigo, setEscaneandoCodigo] = useState(false);

  const puedeGuardar = nombre && precio && stock !== "" && stockMinimo !== "";

  const guardar = () => {
    if (!puedeGuardar) return;
    guardarProducto({
      id: existente ? existente.id : nextId(),
      nombre,
      precio: parseFloat(precio),
      unidad,
      stock: parseFloat(stock),
      stockMinimo: parseFloat(stockMinimo),
      codigoBarras: codigoBarras.trim() ? codigoBarras.trim() : null,
    });
    pop();
  };

  return (
    <div>
      <Header title={esNuevo ? "Nuevo producto" : "Editar producto"} onBack={pop} />
      <div className="px-5 space-y-3 pb-6">
        <div>
          <label className="text-stone-500 text-sm">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>

        <div>
          <label className="text-stone-500 text-sm">Código de barras (opcional)</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="7791234567890"
              className="flex-1 bg-white rounded-2xl shadow-sm px-4 py-3 outline-none text-stone-800"
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
          <p className="text-stone-400 text-xs mt-1">
            Mejor escanealo con la cámara que tipearlo: así queda idéntico al código que la caja va a leer
            después, sin errores de tipeo.
          </p>
        </div>

        <div>
          <label className="text-stone-500 text-sm">Precio de venta</label>
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>

        <div>
          <label className="text-stone-500 text-sm mb-2 block">Unidad de medida</label>
          <div className="flex gap-2">
            {["unidad", "kg"].map((u) => (
              <button
                type="button"
                key={u}
                disabled={!esNuevo}
                onClick={() => setUnidad(u)}
                className={"flex-1 rounded-xl py-2.5 text-sm font-medium border" + (!esNuevo ? " opacity-50" : "")}
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
            <p className="text-stone-400 text-xs mt-1">La unidad de medida no se puede cambiar luego de creado.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-stone-500 text-sm">Stock {esNuevo ? "inicial" : "actual"}</label>
            <input
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
            />
          </div>
          <div>
            <label className="text-stone-500 text-sm">Stock mínimo</label>
            <input
              type="number"
              step={unidad === "kg" ? "0.001" : "1"}
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
            />
          </div>
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={guardar} disabled={!puedeGuardar}>
            Guardar producto
          </PrimaryButton>
        </div>
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

function InfoNegocio({ infoNegocio, guardarInfoNegocio, pop }) {
  const [nombre, setNombre] = useState(infoNegocio.nombre);
  const [contacto, setContacto] = useState(infoNegocio.contacto);

  const guardar = () => {
    if (!nombre) return;
    guardarInfoNegocio({ nombre, contacto });
    pop();
  };

  return (
    <div>
      <Header title="Información del negocio" onBack={pop} />
      <div className="px-5 space-y-3">
        <div>
          <label className="text-stone-500 text-sm">Nombre del almacén</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>
        <div>
          <label className="text-stone-500 text-sm">Teléfono / WhatsApp de contacto</label>
          <input
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 mt-1 outline-none text-stone-800"
          />
        </div>
        <div className="pt-1">
          <PrimaryButton onClick={guardar} disabled={!nombre}>
            Guardar cambios
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// Panel de pruebas de caja automática (punto 14 del pedido) — corre la
// sincronización sobre una caja "sandbox" (storageKey separado) para poder
// simular horarios sin esperar al reloj real ni tocar la caja de producción.
// ===========================================================================
const DIA_1 = "2026-09-14";
const DIA_2 = "2026-09-15";

const ESCENARIOS_PRUEBA = [
  { label: "07:59 · antes de apertura", fecha: DIA_1, horaNumero: 7 + 59 / 60, esperado: "CERRADA" },
  { label: "08:00 · apertura", fecha: DIA_1, horaNumero: 8, esperado: "ABIERTA" },
  { label: "12:00 · mediodía", fecha: DIA_1, horaNumero: 12, esperado: "ABIERTA" },
  { label: "21:59 · antes del cierre", fecha: DIA_1, horaNumero: 21 + 59 / 60, esperado: "ABIERTA" },
  { label: "22:00 · cierre automático", fecha: DIA_1, horaNumero: 22, esperado: "CERRADA" },
  { label: "23:00 · después del cierre", fecha: DIA_1, horaNumero: 23, esperado: "CERRADA" },
  { label: "08:00 día siguiente · nueva jornada", fecha: DIA_2, horaNumero: 8, esperado: "ABIERTA" },
];

function PruebasCaja() {
  const [testCaja, setTestCaja] = useState(null);
  const [log, setLog] = useState([]);
  const [corriendo, setCorriendo] = useState(false);

  const agregarLog = (texto, ok) =>
    setLog((l) => [{ id: nextId(), texto, ok, hora: new Date().toLocaleTimeString("es-UY") }, ...l]);

  const correr = async (escenario) => {
    setCorriendo(true);
    const resultado = await syncCashShift([], {
      override: { fecha: escenario.fecha, horaNumero: escenario.horaNumero },
      storageKey: TEST_CASH_SHIFT_STORAGE_KEY,
    });
    setTestCaja(resultado);
    const estadoObtenido = resultado?.estado || "SIN DATOS";
    const ok = estadoObtenido === escenario.esperado;
    agregarLog(
      `${escenario.label} → esperado ${escenario.esperado}, obtenido ${estadoObtenido}`,
      ok
    );
    setCorriendo(false);
  };

  const correrIdempotencia = async () => {
    setCorriendo(true);
    const escenario = { fecha: DIA_1, horaNumero: 12 };
    const resultados = [];
    for (let i = 0; i < 3; i++) {
      const r = await syncCashShift([], {
        override: escenario,
        storageKey: TEST_CASH_SHIFT_STORAGE_KEY,
      });
      resultados.push(JSON.stringify(r));
    }
    setTestCaja(JSON.parse(resultados[2]));
    const estable = resultados[0] === resultados[1] && resultados[1] === resultados[2];
    agregarLog(
      estable
        ? "Ejecutada 3 veces seguidas a las 12:00 → mismo resultado, sin duplicar (OK)"
        : "Ejecutada 3 veces seguidas → los resultados difieren (revisar)",
      estable
    );
    setCorriendo(false);
  };

  const intentarVentaConCajaCerrada = () => {
    const bloqueada = !testCaja || testCaja.estado !== "ABIERTA";
    agregarLog(
      bloqueada
        ? "Intento de venta con caja cerrada → bloqueada correctamente (OK)"
        : "Intento de venta con caja cerrada → NO se bloqueó (revisar)",
      bloqueada
    );
  };

  const reiniciarSandbox = async () => {
    setCorriendo(true);
    try {
      await removeKey(TEST_CASH_SHIFT_STORAGE_KEY);
    } catch (e) {}
    setTestCaja(null);
    setLog([]);
    setCorriendo(false);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-1">
        <p className="text-sm font-semibold text-stone-800">Estado sandbox actual</p>
        {testCaja ? (
          <EstadoCajaCard caja={testCaja} totalHoy={0} />
        ) : (
          <p className="text-xs text-stone-400">Todavía no corriste ningún escenario.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-stone-500 px-1">Escenarios de horario</p>
        {ESCENARIOS_PRUEBA.map((e, i) => (
          <button
            key={i}
            type="button"
            disabled={corriendo}
            onClick={() => correr(e)}
            className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
            style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-stone-500 px-1">Otras verificaciones</p>
        <button
          type="button"
          disabled={corriendo}
          onClick={correrIdempotencia}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
        >
          Ejecutar 3 veces seguidas a las 12:00 (idempotencia)
        </button>
        <button
          type="button"
          disabled={corriendo}
          onClick={intentarVentaConCajaCerrada}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#44403C", borderColor: "#E7E5E4" }}
        >
          Simular intento de venta con la caja del sandbox cerrada
        </button>
        <button
          type="button"
          disabled={corriendo}
          onClick={reiniciarSandbox}
          className="w-full text-left text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FAF8F5", color: "#C0392B", borderColor: "#E7E5E4" }}
        >
          Reiniciar sandbox de pruebas
        </button>
      </div>

      {log.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-stone-500 px-1">Resultados</p>
          {log.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-xs px-1">
              <span>{l.ok ? "✅" : "⚠️"}</span>
              <span className="text-stone-600 flex-1">{l.texto}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BorrarDatos() {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const borrarTodo = async () => {
    setBorrando(true);
    try { await removeKey("datos:productos"); } catch (e) {}
    try { await removeKey("datos:movimientos"); } catch (e) {}
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-4 py-3 space-y-2">
      <p className="text-xs font-semibold text-stone-500 px-1">Empezar de cero</p>
      <p className="text-xs text-stone-500 px-1">
        Borra todos los productos y todo el historial de ventas de este dispositivo. La caja (abierta/cerrada)
        no se toca. No se puede deshacer.
      </p>
      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full text-sm rounded-xl px-3 py-2.5 border"
          style={{ backgroundColor: "#FFFFFF", color: "#C0392B", borderColor: "#E7E5E4" }}
        >
          Borrar todos los productos y ventas
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold px-1" style={{ color: COLORS.agotado }}>
            ¿Seguro? Esto borra todo y no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 text-sm rounded-xl px-3 py-2.5 border"
              style={{ backgroundColor: "#FFFFFF", color: "#57534E", borderColor: "#E7E5E4" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={borrarTodo}
              disabled={borrando}
              className="flex-1 text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "#C0392B", color: "#FFFFFF" }}
            >
              {borrando ? "Borrando..." : "Sí, borrar todo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Configuracion({ pop }) {
  return (
    <div>
      <Header title="Configuración" onBack={pop} />
      <div className="px-5 space-y-4 pb-6">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-8 text-center">
          <p className="text-stone-600 font-medium">Configuración</p>
          <p className="text-stone-400 text-sm mt-2">Esta sección estará disponible en una etapa futura.</p>
        </div>
        <BorrarDatos />
        <div>
          <p className="text-xs font-semibold text-stone-500 px-1 mb-2">
            Pruebas · caja automática
          </p>
          <PruebasCaja />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// App principal — SOLO estado global y orquestación. Ningún componente con
// hooks propios se define aquí adentro: todos viven arriba, a nivel de
// módulo, y reciben lo que necesitan por props.
// ===========================================================================
export default function App() {
  const [productos, setProductos] = useState(initialProducts);
  const [movimientos, setMovimientos] = useState(initialStockMovements);
  const [infoNegocio, setInfoNegocio] = useState({
    nombre: "Almacén de la familia",
    contacto: "099 123 456",
  });
  const [cargado, setCargado] = useState(false);

  // Carga inicial: si hay datos guardados de una sesión anterior, los usamos
  // en vez de los datos de ejemplo (initialProducts/initialStockMovements).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
       const data = await listProducts();

// Si Supabase ya tiene productos, los cargamos normalmente.
if (data && data.length > 0) {
  if (activo) {
    setProductos(
      data.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio),
        unidad: p.unidad,
        stock: Number(p.stock),
        stockMinimo: Number(p.stock_minimo),
        codigoBarras: p.codigo_barras,
      }))
    );
  }
}
} catch (e) {
  console.error("Error cargando productos:", e);
}
      try {
        const movs = await readJson("datos:movimientos");
        if (activo && movs) {
          const lista = movs.map((m) => ({ ...m, fecha: new Date(m.fecha) }));
          setMovimientos(lista);
        }
      } catch (e) {}
      try {
  const data = await listSalesWithItems();

  if (activo && data) {
    const ventasFormateadas = data.map((v) => ({
      id: v.id,
      fecha: new Date(v.fecha),
      tipo: "venta",
      total: Number(v.total),
      pago: v.pago,
      items: (v.venta_items || []).map((it) => ({
        productoId: it.producto_id,
        nombre: it.nombre,
        cantidad: Number(it.cantidad),
        unidad: it.unidad,
        precio: Number(it.precio_unitario),
        subtotal: Number(it.subtotal),
      })),
    }));

    setMovimientos((prev) => {
      const otros = prev.filter((m) => m.tipo !== "venta");
      return [...ventasFormateadas, ...otros];
    });
  }
} catch (e) {
  console.error("Error cargando ventas:", e);
}
      try {
        const info = await readJson("datos:infoNegocio");
        if (activo && info) setInfoNegocio(info);
      } catch (e) {}
      if (activo) setCargado(true);
    })();
    return () => { activo = false; };
  }, []);
useEffect(() => {
  const canal = supabase
    .channel("productos-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "productos",
        filter: "negocio_id=eq.1",
      },
      (payload) => {
        const producto = payload.new;

        if (payload.eventType === "DELETE") {
          setProductos((prev) =>
            prev.filter((p) => p.id !== payload.old.id)
          );
          return;
        }

        if (producto) {
          const productoFormateado = {
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            unidad: producto.unidad,
            stock: Number(producto.stock),
            stockMinimo: Number(producto.stock_minimo),
            codigoBarras: producto.codigo_barras || "",
          };

          setProductos((prev) => {
            const existe = prev.some(
              (p) => p.id === productoFormateado.id
            );

            return existe
              ? prev.map((p) =>
                  p.id === productoFormateado.id
                    ? productoFormateado
                    : p
                )
              : [...prev, productoFormateado];
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);
  useEffect(() => {
  const canal = supabase
    .channel("movimientos-stock-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "movimientos_stock",
        filter: "negocio_id=eq.1",
      },
      (payload) => {
        const movimiento = payload.new;

  if (!movimiento || movimiento.tipo === "venta") return;

        setMovimientos((prev) => [
          {
            id: movimiento.id,
            fecha: new Date(movimiento.fecha),
            tipo: movimiento.tipo,
            productoId: movimiento.producto_id,
            cantidad: Number(movimiento.cantidad),
            unidad: movimiento.unidad,
            diferencia: Number(movimiento.diferencia),
            motivo: movimiento.motivo,
          },
          ...prev,
        ]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);
  useEffect(() => {
  const canal = supabase
    .channel("ventas-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ventas",
        filter: "negocio_id=eq.1",
      },
      async (payload) => {
        const venta = payload.new;

        if (!venta) return;

        let items;
        try {
          items = await listSaleItems(venta.id);
        } catch (error) {
          console.error("Error cargando items de venta:", error);
          return;
        }

        const ventaFormateada = {
          id: venta.id,
          fecha: new Date(venta.fecha),
          tipo: "venta",
          total: Number(venta.total),
          pago: venta.pago,
          items: (items || []).map((it) => ({
            productoId: it.producto_id,
            nombre: it.nombre,
            cantidad: Number(it.cantidad),
            unidad: it.unidad,
            precio: Number(it.precio_unitario),
            subtotal: Number(it.subtotal),
          })),
        };

        setMovimientos((prev) => {
          const existe = prev.some((m) => m.id === ventaFormateada.id);

          if (existe) return prev;

          return [ventaFormateada, ...prev];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);
  useEffect(() => {
  const canal = supabase
    .channel("jornada-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "jornada",
        filter: "negocio_id=eq.1",
      },
      (payload) => {
        const jornada = payload.new;

        if (!jornada) return;

        const jornadaFormateada = {
          id: jornada.id,
          fecha: jornada.fecha,
          estado: jornada.estado,
          horaApertura: jornada.hora_apertura,
          horaCierre: jornada.hora_cierre,
          cerradoAutomaticamente: jornada.cerrado_automatico,
          total: Number(jornada.total || 0),
          cantidadVentas: Number(jornada.cantidad_ventas || 0),
        };

        setCaja((prev) => {
          if (!prev || prev.id === jornadaFormateada.id) {
            return jornadaFormateada;
          }

          return prev;
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}, []);
  // Guardado: recién después de terminar la carga inicial, para no pisar
  // datos guardados con los datos de ejemplo del primer render.
 
  useEffect(() => {
    if (!cargado) return;
    writeJson("datos:movimientos", movimientos).catch(() => {});
  }, [cargado, movimientos]);

  useEffect(() => {
    if (!cargado) return;
    writeJson("datos:infoNegocio", infoNegocio).catch(() => {});
  }, [cargado, infoNegocio]);

  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState([]); // [{screen, params}]
  const {
    cashShift: caja,
    setCashShift: setCaja,
    openCashShiftManually: abrirCajaManual,
  } = useCashRegister();

  useEffect(() => {
    let activo = true;
    const verificarCaja = async () => {
      const estado = await syncCashShift(movimientos);
      if (activo) setCaja(estado);
    };
    verificarCaja();
    const intervalo = setInterval(verificarCaja, 30000);
    return () => { activo = false; clearInterval(intervalo); };
  }, [movimientos]);

  const current = stack.length ? stack[stack.length - 1] : { screen: "main", params: {} };

  const goTab = (newTab) => {
    setTab(newTab);
    setStack([]);
  };
  const goTabScreen = (newTab, screen, params = {}) => {
    setTab(newTab);
    setStack([{ screen, params }]);
  };
  const push = (screen, params = {}) => setStack((s) => [...s, { screen, params }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetStack = () => setStack([]);

const registrarMovimiento = async (mov) => {
  const movimiento = {
    id: nextId(),
    fecha: new Date(),
    ...mov,
  };

  if (mov.tipo === "entrada") {
    console.log("REGISTRANDO MOVIMIENTO:", mov);
    
    try {
      await insertStockEntry({
        negocio_id: 1,
        producto_id: mov.productoId,
        jornada_id: null,
        fecha: movimiento.fecha.toISOString(),
        tipo: "entrada",
        cantidad: Number(mov.cantidad),
        unidad: mov.unidad,
        diferencia: Number(mov.cantidad),
        motivo: "Entrada de stock",
      });
    } catch (error) {
      console.error("Error guardando movimiento de entrada:", error);
      alert("No se pudo guardar el movimiento de stock.");
      return false;
    }
  }

  setMovimientos((m) => [movimiento, ...m]);

  return true;
};

const actualizarStock = async (id, nuevoStock) => {
  try {
    await updateProductStock(id, nuevoStock);
  } catch (error) {
    console.error("Error actualizando stock en Supabase:", error);
    alert("No se pudo actualizar el stock.");
    return false;
  }

  setProductos((prev) =>
    prev.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p))
  );

  return true;
};

 const guardarProducto = async (producto) => {
  const productoSupabase = toProductUpsert({
    id: producto.id,
    name: producto.nombre,
    price: producto.precio,
    unit: producto.unidad,
    stock: producto.stock,
    minimumStock: producto.stockMinimo,
    barcode: producto.codigoBarras,
  });

  try {
    await upsertProduct(productoSupabase);
  } catch (error) {
    console.error("Error guardando producto en Supabase:", error);
    alert("No se pudo guardar el producto.");
    return;
  }

  setProductos((prev) => {
    const existe = prev.some((p) => p.id === producto.id);

    return existe
      ? prev.map((p) => (p.id === producto.id ? producto : p))
      : [...prev, producto];
  });
};

  const guardarInfoNegocio = (datos) => {
    setInfoNegocio(datos);
  };

  const ventasHoy = getTodaySales(movimientos);
  const totalHoy = getTodayTotal(ventasHoy);
  const efectivoHoy = getTodayCashTotal(ventasHoy);
  const debitoHoy = getTodayDebitTotal(ventasHoy);
  const productosVendidosHoy = getTodayProductsSold(ventasHoy);

  const productosBajo = getLowStockProducts(productos);
  const productosAgotados = getOutOfStockProducts(productos);
  const ventasSemana = getWeekSales(movimientos);
  function renderTab() {
    if (tab === "home") {
      return (
        <PantallaInicio
          totalHoy={totalHoy}
          efectivoHoy={efectivoHoy}
          debitoHoy={debitoHoy}
          productosVendidosHoy={productosVendidosHoy}
          productosBajo={productosBajo}
          productosAgotados={productosAgotados}
          goTabScreen={goTabScreen}
          caja={caja}
        />
      );
    }

    if (tab === "sales") {
      if (current.screen === "newSale")
        return (
       <NuevaVenta
  productos={productos}
  setProductos={setProductos}
  registrarMovimiento={registrarMovimiento}
  actualizarStock={actualizarStock}
  pop={pop}
  resetStack={resetStack}
  caja={caja}
/>
        );
      if (current.screen === "dayClosing")
        return (
          <CierreDia
            totalHoy={totalHoy}
            efectivoHoy={efectivoHoy}
            debitoHoy={debitoHoy}
            ventasHoy={ventasHoy}
            pop={pop}
            caja={caja}
            actualizarCaja={setCaja}
          />
        );
      if (current.screen === "closingHistory") return <HistorialCierres pop={pop} />;
      return <VentasMain push={push} caja={caja} totalHoy={totalHoy} abrirCajaManual={abrirCajaManual} />;
    }

    if (tab === "stock") {
      if (current.screen === "productCatalog")
        return (
          <VerProductos
            productos={productos}
            pop={pop}
            onOpenDetalle={(id) => push("productDetail", { productId: id })}
          />
        );
      if (current.screen === "productDetail")
        return (
          <DetalleProducto
            productos={productos}
            productoId={current.params.productId}
            pop={pop}
            goTabScreen={goTabScreen}
          />
        );
      if (current.screen === "lowStock")
        return (
          <StockBajo
            productosAgotados={productosAgotados}
            productosBajo={productosBajo}
            pop={pop}
            onOpenDetalle={(id) => push("productDetail", { productId: id })}
          />
        );
      if (current.screen === "addStockEntry")
        return (
          <AgregarEntrada
            productos={productos}
            productoIdInicial={current.params.productId}
            actualizarStock={actualizarStock}
            registrarMovimiento={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "adjustStock")
        return (
          <AjustarStock
            productos={productos}
            productoIdInicial={current.params.productId}
            actualizarStock={actualizarStock}
            registrarMovimiento={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      return <StockMain push={push} />;
    }

    if (tab === "movements") {
      if (current.screen === "stockMovementDetail")
        return <DetalleMovimiento movimientos={movimientos} movimientoId={current.params.movementId} pop={pop} />;
      return (
        <Movimientos
          movimientos={movimientos}
          onOpenDetalle={(id) => push("stockMovementDetail", { movementId: id })}
        />
      );
    }

    if (tab === "more") {
      if (current.screen === "products")
        return (
          <ProductosMain
            productos={productos}
            pop={pop}
            onOpenDetalle={(id) => push("productForm", { productId: id })}
            onNuevo={() => push("productForm", { productId: null })}
          />
        );
      if (current.screen === "productForm")
        return (
          <FormularioProducto
            productos={productos}
            productoId={current.params.productId}
            guardarProducto={guardarProducto}
            pop={pop}
          />
        );
      if (current.screen === "businessInfo")
        return <InfoNegocio infoNegocio={infoNegocio} guardarInfoNegocio={guardarInfoNegocio} pop={pop} />;
      if (current.screen === "settings") return <Configuracion pop={pop} />;
      return <MasMain push={push} />;
    }

    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#FAF8F5" }}>
      <style>{`
        button { -webkit-tap-highlight-color: transparent; }
        button:focus { outline: none; }
        button:focus-visible { outline: 2px solid #2E6B4F; outline-offset: 2px; }
      `}</style>
      <div className="w-full max-w-sm min-h-screen relative pb-24" style={{ backgroundColor: "#FAF8F5" }}>
        {renderTab()}
        <BottomNav active={tab} onChange={goTab} />
      </div>
    </div>
  );
}
