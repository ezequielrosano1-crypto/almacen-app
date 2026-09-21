import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./data/supabaseClient";
import {
  COLORS,
  CASH_SHIFT_STORAGE_KEY,
} from "./lib/constants";
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
import { readJson, writeJson, removeKey } from "./lib/storage/storage";
import { toProductUpsert } from "./data/mappers";
import {
  listProducts,
  updateProductStock,
  upsertProduct,
} from "./data/productsRepository";
import {
  listSalesWithItems,
  listSaleItems,
} from "./data/salesRepository";
import { insertStockEntry } from "./data/stockMovementsRepository";
import { syncCashShift } from "./data/cashShiftSync";
import { useCashRegister } from "./hooks/useCashRegister";
import { Header } from "./components/Header";
import { PrimaryButton } from "./components/PrimaryButton";
import { BottomNav } from "./components/BottomNav";
import { CashRegisterStatusCard as EstadoCajaCard } from "./components/CashRegisterStatusCard";
import { HomeView } from "./views/HomeView";
import { SalesView } from "./views/SalesView";
import { NewSaleView } from "./views/NewSaleView";
import { DayClosingView } from "./views/DayClosingView";
import { ClosingHistoryView } from "./views/ClosingHistoryView";
import { StockView } from "./views/StockView";
import { ProductCatalogView } from "./views/ProductCatalogView";
import { ProductDetailView } from "./views/ProductDetailView";
import { LowStockView } from "./views/LowStockView";
import { AddStockEntryView } from "./views/AddStockEntryView";
import { AdjustStockView } from "./views/AdjustStockView";
import { StockMovementsView } from "./views/StockMovementsView";
import { StockMovementDetailView } from "./views/StockMovementDetailView";
import { MoreView } from "./views/MoreView";
import { BusinessInfoView } from "./views/BusinessInfoView";
import { ProductsView } from "./views/ProductsView";
import { ProductFormView } from "./views/ProductFormView";
import { CashRegisterSandboxView } from "./views/CashRegisterSandboxView";

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






// ===========================================================================
// STOCK
// ===========================================================================

// ===========================================================================
// MOVIMIENTOS
// ===========================================================================

// ===========================================================================
// MÁS
// ===========================================================================





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
          <CashRegisterSandboxView />
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
        <HomeView
          todayTotal={totalHoy}
          todayCashTotal={efectivoHoy}
          todayDebitTotal={debitoHoy}
          todayProductsSold={productosVendidosHoy}
          lowStockProducts={productosBajo}
          outOfStockProducts={productosAgotados}
          goTabScreen={goTabScreen}
          cashShift={caja}
        />
      );
    }

    if (tab === "sales") {
      if (current.screen === "newSale")
        return (
          <NewSaleView
            products={productos}
            setProducts={setProductos}
            recordStockMovement={registrarMovimiento}
            updateStock={actualizarStock}
            pop={pop}
            resetStack={resetStack}
            cashShift={caja}
          />
        );
      if (current.screen === "dayClosing")
        return (
          <DayClosingView
            todayTotal={totalHoy}
            todayCashTotal={efectivoHoy}
            todayDebitTotal={debitoHoy}
            todaySales={ventasHoy}
            pop={pop}
            cashShift={caja}
            onUpdateCashShift={setCaja}
          />
        );
      if (current.screen === "closingHistory") return <ClosingHistoryView pop={pop} />;
      return (
        <SalesView
          push={push}
          cashShift={caja}
          todayTotal={totalHoy}
          openCashShiftManually={abrirCajaManual}
        />
      );
    }

    if (tab === "stock") {
      if (current.screen === "productCatalog")
        return (
          <ProductCatalogView
            products={productos}
            pop={pop}
            onOpenDetail={(id) => push("productDetail", { productId: id })}
          />
        );
      if (current.screen === "productDetail")
        return (
          <ProductDetailView
            products={productos}
            productId={current.params.productId}
            pop={pop}
            goTabScreen={goTabScreen}
          />
        );
      if (current.screen === "lowStock")
        return (
          <LowStockView
            outOfStockProducts={productosAgotados}
            lowStockProducts={productosBajo}
            pop={pop}
            onOpenDetail={(id) => push("productDetail", { productId: id })}
          />
        );
      if (current.screen === "addStockEntry")
        return (
          <AddStockEntryView
            products={productos}
            initialProductId={current.params.productId}
            updateStock={actualizarStock}
            recordMovement={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "adjustStock")
        return (
          <AdjustStockView
            products={productos}
            initialProductId={current.params.productId}
            updateStock={actualizarStock}
            recordMovement={registrarMovimiento}
            pop={pop}
            resetStack={resetStack}
          />
        );
      return <StockView push={push} />;
    }

    if (tab === "movements") {
      if (current.screen === "stockMovementDetail")
        return (
          <StockMovementDetailView
            movements={movimientos}
            movementId={current.params.movementId}
            pop={pop}
          />
        );
      return (
        <StockMovementsView
          movements={movimientos}
          onOpenDetail={(id) => push("stockMovementDetail", { movementId: id })}
        />
      );
    }

    if (tab === "more") {
      if (current.screen === "products")
        return (
          <ProductsView
            products={productos}
            pop={pop}
            onOpenDetail={(id) => push("productForm", { productId: id })}
            onNew={() => push("productForm", { productId: null })}
          />
        );
      if (current.screen === "productForm")
        return (
          <ProductFormView
            products={productos}
            productId={current.params.productId}
            saveProduct={guardarProducto}
            pop={pop}
          />
        );
      if (current.screen === "businessInfo")
        return (
          <BusinessInfoView
            businessInfo={infoNegocio}
            saveBusinessInfo={guardarInfoNegocio}
            pop={pop}
          />
        );
      if (current.screen === "settings") return <Configuracion pop={pop} />;
      return <MoreView push={push} />;
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
