import { BottomNav } from "./components/BottomNav";
import { useBusinessInfo } from "./hooks/useBusinessInfo";
import { useCashRegister } from "./hooks/useCashRegister";
import { useCashShiftAutoSync } from "./hooks/useCashShiftAutoSync";
import { useCashShiftRealtime } from "./hooks/useCashShiftRealtime";
import { useInitialLoad } from "./hooks/useInitialLoad";
import { useNavigation } from "./hooks/useNavigation";
import { useProducts } from "./hooks/useProducts";
import { useProductsRealtime } from "./hooks/useProductsRealtime";
import { useSalesRealtime } from "./hooks/useSalesRealtime";
import { useStockMovements } from "./hooks/useStockMovements";
import { useStockMovementsRealtime } from "./hooks/useStockMovementsRealtime";
import { useStorageSync } from "./hooks/useStorageSync";
import {
  getLowStockProducts,
  getOutOfStockProducts,
  getTodayCashTotal,
  getTodayDebitTotal,
  getTodayProductsSold,
  getTodaySales,
  getTodayTotal,
} from "./lib/metrics";
import { AddStockEntryView } from "./views/AddStockEntryView";
import { AdjustStockView } from "./views/AdjustStockView";
import { BusinessInfoView } from "./views/BusinessInfoView";
import { ClosingHistoryView } from "./views/ClosingHistoryView";
import { DayClosingView } from "./views/DayClosingView";
import { HomeView } from "./views/HomeView";
import { LowStockView } from "./views/LowStockView";
import { MoreView } from "./views/MoreView";
import { NewSaleView } from "./views/NewSaleView";
import { ProductCatalogView } from "./views/ProductCatalogView";
import { ProductDetailView } from "./views/ProductDetailView";
import { ProductFormView } from "./views/ProductFormView";
import { ProductsView } from "./views/ProductsView";
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
  const { products, setProducts, updateStock, saveProduct } = useProducts();
  const { movements, setMovements, recordStockMovement } = useStockMovements();
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
  useStorageSync("datos:movimientos", movements, loaded);
  useStorageSync("datos:infoNegocio", businessInfo, loaded);
  useCashShiftAutoSync(movements, setCashShift);

  const todaySales = getTodaySales(movements);
  const todayTotal = getTodayTotal(todaySales);
  const todayCashTotal = getTodayCashTotal(todaySales);
  const todayDebitTotal = getTodayDebitTotal(todaySales);
  const todayProductsSold = getTodayProductsSold(todaySales);

  const lowStockProducts = getLowStockProducts(products);
  const outOfStockProducts = getOutOfStockProducts(products);

  function renderTab() {
    if (tab === "home") {
      return (
        <HomeView
          todayTotal={todayTotal}
          todayCashTotal={todayCashTotal}
          todayDebitTotal={todayDebitTotal}
          todayProductsSold={todayProductsSold}
          lowStockProducts={lowStockProducts}
          outOfStockProducts={outOfStockProducts}
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
            recordStockMovement={recordStockMovement}
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
          openCashShiftManually={openCashShiftManually}
        />
      );
    }

    if (tab === "stock") {
      if (current.screen === "productCatalog")
        return (
          <ProductCatalogView
            products={products}
            pop={pop}
            onOpenDetail={(id) => push("productDetail", { productId: id })}
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
            updateStock={updateStock}
            recordMovement={recordStockMovement}
            pop={pop}
            resetStack={resetStack}
          />
        );
      if (current.screen === "adjustStock")
        return (
          <AdjustStockView
            products={products}
            initialProductId={current.params.productId}
            updateStock={updateStock}
            recordMovement={recordStockMovement}
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
            movements={movements}
            movementId={current.params.movementId}
            pop={pop}
          />
        );
      return (
        <StockMovementsView
          movements={movements}
          onOpenDetail={(id) => push("stockMovementDetail", { movementId: id })}
        />
      );
    }

    if (tab === "more") {
      if (current.screen === "products")
        return (
          <ProductsView
            products={products}
            pop={pop}
            onOpenDetail={(id) => push("productForm", { productId: id })}
            onNew={() => push("productForm", { productId: null })}
          />
        );
      if (current.screen === "productForm")
        return (
          <ProductFormView
            products={products}
            productId={current.params.productId}
            saveProduct={saveProduct}
            pop={pop}
          />
        );
      if (current.screen === "businessInfo")
        return (
          <BusinessInfoView
            businessInfo={businessInfo}
            saveBusinessInfo={saveBusinessInfo}
            pop={pop}
          />
        );
      if (current.screen === "settings") return <SettingsView pop={pop} />;
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
      <div
        className="w-full max-w-sm min-h-screen relative pb-24"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        {renderTab()}
        <BottomNav active={tab} onChange={goTab} />
      </div>
    </div>
  );
}
