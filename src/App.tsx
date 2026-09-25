import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/layout/AppShell";
import { useBusinessInfo } from "./hooks/useBusinessInfo";
import { useCashRegister } from "./hooks/useCashRegister";
import { useCashShiftAutoSync } from "./hooks/useCashShiftAutoSync";
import { useCashShiftRealtime } from "./hooks/useCashShiftRealtime";
import { useInitialLoad } from "./hooks/useInitialLoad";
import { useNavigation } from "./hooks/useNavigation";
import { applyStockUpdate, useProducts } from "./hooks/useProducts";
import { useProductsRealtime } from "./hooks/useProductsRealtime";
import { useSalesRealtime } from "./hooks/useSalesRealtime";
import { type StockMovementInput, useStockMovements } from "./hooks/useStockMovements";
import { useStockMovementsRealtime } from "./hooks/useStockMovementsRealtime";
import { useStorageSync } from "./hooks/useStorageSync";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  getSalesDelta,
  getTodayCashTotal,
  getTodayDebitTotal,
  getTodayProductsSold,
  getTodaySales,
  getTodayTotal,
  getTopProducts,
  getWeekSales,
} from "./lib/metrics";
import { AddStockEntryView } from "./views/AddStockEntryView";
import { AdjustStockView } from "./views/AdjustStockView";
import { BusinessInfoView } from "./views/BusinessInfoView";
import { ComingSoonView } from "./views/ComingSoonView";
import { ClosingHistoryView } from "./views/ClosingHistoryView";
import { DayClosingView } from "./views/DayClosingView";
import { HomeView } from "./views/HomeView";
import { LowStockView } from "./views/LowStockView";
import { MoreView } from "./views/MoreView";
import { NewSaleView } from "./views/NewSaleView";
import { ProductDetailView } from "./views/ProductDetailView";
import { ProductFormView } from "./views/ProductFormView";
import { SalesView } from "./views/SalesView";
import { SettingsView } from "./views/SettingsView";
import { StockMovementDetailView } from "./views/StockMovementDetailView";
import { StockMovementsView } from "./views/StockMovementsView";
import { StockView } from "./views/StockView";

// ===========================================================================
// App principal — SOLO estado global y orquestación. Ningún componente con
// hooks propios se define aquí adentro: todos viven en components/ o views/ y
// reciben lo que necesitan por props.
// ===========================================================================
export default function App() {
  const { products, setProducts, updateStock, saveProduct, deleteProduct } = useProducts();
  const { movements, setMovements, recordStockMovement } = useStockMovements();

  // Entradas and ajustes: the server updates the stock and records the movement in one
  // transaction; the product in state is set from the stock it returns (no client math).
  const registerStockMovement = async (mov: StockMovementInput) => {
    const saved = await recordStockMovement(mov);
    if (saved?.movimiento.producto_id != null) {
      const productId = saved.movimiento.producto_id;
      setProducts((prev) => applyStockUpdate(prev, productId, saved.stock));
    }
    return saved;
  };
  const { businessInfo, setBusinessInfo, saveBusinessInfo } = useBusinessInfo();
  const { loaded } = useInitialLoad({
    setProducts,
    setStockMovements: setMovements,
    setBusinessInfo,
  });
  // useCashRegister no tiene efectos: se declara antes para que useCashShiftRealtime
  // ocupe la misma posición que el efecto original sin alterar el orden de efectos.
  const { cashShift, setCashShift, openCashShiftManually } = useCashRegister();

  // El orden de estas llamadas es crítico: replica el orden de efectos del App original
  // (carga inicial, realtime de productos, movimientos, ventas y caja, guardado, sync).
  // The order is load-bearing: do not reorder these hook calls.
  useProductsRealtime(setProducts);
  useStockMovementsRealtime(setMovements);
  useSalesRealtime(setMovements);
  useCashShiftRealtime(setCashShift);
  const { tab, current, goTab, goTabScreen, push, pop, resetStack } = useNavigation();
  useStorageSync("datos:infoNegocio", businessInfo, loaded);
  useCashShiftAutoSync(movements, setCashShift);

  const todaySales = getTodaySales(movements);
  const todayTotal = getTodayTotal(todaySales);
  const todayCashTotal = getTodayCashTotal(todaySales);
  const todayDebitTotal = getTodayDebitTotal(todaySales);
  const todayProductsSold = getTodayProductsSold(todaySales);
  const weekSales = getWeekSales(movements);
  const salesDelta = getSalesDelta(movements);
  const topProducts = getTopProducts(movements, 5);

  const lowStockProducts = getLowStockProducts(products);
  const outOfStockProducts = getOutOfStockProducts(products);

  function renderTab() {
    if (tab === "home") {
      return (
        <HomeView
          businessName={businessInfo.nombre}
          todayTotal={todayTotal}
          todaySalesCount={todaySales.length}
          todayProductsSold={todayProductsSold}
          weekSales={weekSales}
          salesDelta={salesDelta}
          lowStockProducts={lowStockProducts}
          outOfStockProducts={outOfStockProducts}
          topProducts={topProducts}
          goTabScreen={goTabScreen}
          cashShift={cashShift}
        />
      );
    }

    if (tab === "sales") {
      if (current.screen === "newSale")
        return (
          <NewSaleView
            products={products}
            setProducts={setProducts}
            recordStockMovement={registerStockMovement}
            updateStock={updateStock}
            pop={pop}
            resetStack={resetStack}
            cashShift={cashShift}
          />
        );
      if (current.screen === "dayClosing")
        return (
          <DayClosingView
            todayTotal={todayTotal}
            todayCashTotal={todayCashTotal}
            todayDebitTotal={todayDebitTotal}
            todaySales={todaySales}
            pop={pop}
            cashShift={cashShift}
            onUpdateCashShift={setCashShift}
          />
        );
      if (current.screen === "closingHistory") return <ClosingHistoryView pop={pop} />;
      return (
        <SalesView
          push={push}
          cashShift={cashShift}
          todayTotal={todayTotal}
          todaySales={todaySales}
          openCashShiftManually={openCashShiftManually}
        />
      );
    }

    if (tab === "stock") {
      if (current.screen === "productForm")
        return (
          <ProductFormView
            products={products}
            productId={current.params.productId}
            saveProduct={saveProduct}
            deleteProduct={deleteProduct}
            pop={pop}
          />
        );
      if (current.screen === "productDetail")
        return (
          <ProductDetailView
            products={products}
            productId={current.params.productId}
            pop={pop}
            goTabScreen={goTabScreen}
          />
        );
      if (current.screen === "lowStock")
        return (
          <LowStockView
            outOfStockProducts={outOfStockProducts}
            lowStockProducts={lowStockProducts}
            pop={pop}
            onOpenDetail={(id) => push("productDetail", { productId: id })}
          />
        );
      if (current.screen === "addStockEntry")
        return (
          <AddStockEntryView
            products={products}
            initialProductId={current.params.productId}
            recordMovement={registerStockMovement}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "adjustStock")
        return (
          <AdjustStockView
            products={products}
            initialProductId={current.params.productId}
            recordMovement={registerStockMovement}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "movements")
        return (
          <StockMovementsView
            movements={movements}
            onOpenDetail={(id) => push("stockMovementDetail", { movementId: id })}
          />
        );
      if (current.screen === "stockMovementDetail")
        return (
          <StockMovementDetailView
            movements={movements}
            movementId={current.params.movementId}
            pop={pop}
          />
        );
      return <StockView products={products} push={push} goTabScreen={goTabScreen} />;
    }

    if (tab === "purchases" || tab === "suppliers" || tab === "reports") {
      return <ComingSoonView section={tab} />;
    }

    if (tab === "more") {
      if (current.screen === "businessInfo")
        return (
          <BusinessInfoView
            businessInfo={businessInfo}
            saveBusinessInfo={saveBusinessInfo}
            pop={pop}
          />
        );
      if (current.screen === "settings") return <SettingsView pop={pop} />;
      return <MoreView push={push} goTab={goTab} />;
    }

    return null;
  }

  return (
    <>
      <AppShell tab={tab} onTabChange={goTab} businessName={businessInfo.nombre}>
        {renderTab()}
      </AppShell>
      {/* Toasts replace window alerts; offset clears the fixed mobile bottom nav. */}
      <Toaster theme="light" mobileOffset={{ bottom: "88px" }} />
    </>
  );
}
