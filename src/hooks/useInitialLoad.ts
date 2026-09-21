import { useEffect, useState } from "react";
import { listProducts as defaultListProducts } from "../data/productsRepository";
import { listSalesWithItems as defaultListSalesWithItems } from "../data/salesRepository";
import { readJson as defaultReadJson } from "../lib/storage/storage";
import type { MovementRecordItem } from "../types/domain";
import type { StoredStockMovement } from "../types/storage";
import type { BusinessInfoData } from "./useBusinessInfo";
import type { ProductItem } from "./useProducts";

type StockMovementsSetter = (
  updater: MovementRecordItem[] | ((prev: MovementRecordItem[]) => MovementRecordItem[]),
) => void;

export interface InitialLoadCallbacks {
  isActive: () => boolean;
  setProducts: (products: ProductItem[]) => void;
  setStockMovements: StockMovementsSetter;
  setBusinessInfo: (info: BusinessInfoData) => void;
  setLoaded: (loaded: boolean) => void;
}

export interface InitialLoadDeps {
  listProducts?: typeof defaultListProducts;
  readJson?: typeof defaultReadJson;
  listSalesWithItems?: typeof defaultListSalesWithItems;
}

export async function runInitialLoad(
  callbacks: InitialLoadCallbacks,
  deps: InitialLoadDeps = {},
): Promise<void> {
  const fetchProducts = deps.listProducts ?? defaultListProducts;
  const loadJson = deps.readJson ?? defaultReadJson;
  const fetchSales = deps.listSalesWithItems ?? defaultListSalesWithItems;

  try {
    const data = await fetchProducts();
    if (data && data.length > 0) {
      if (callbacks.isActive()) {
        callbacks.setProducts(
          data.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            name: p.nombre,
            precio: Number(p.precio),
            price: Number(p.precio),
            unidad: p.unidad,
            unit: p.unidad,
            stock: Number(p.stock),
            stockMinimo: Number(p.stock_minimo),
            minimumStock: Number(p.stock_minimo),
            codigoBarras: p.codigo_barras,
            barcode: p.codigo_barras,
          })),
        );
      }
    }
  } catch (e) {
    console.error("Error cargando productos:", e);
  }

  try {
    const movs = await loadJson<StoredStockMovement[]>("datos:movimientos");
    if (callbacks.isActive() && movs) {
      const lista = movs.map((m) => ({ ...m, fecha: new Date(m.fecha) }));
      callbacks.setStockMovements(lista);
    }
  } catch (_e) {}

  try {
    const data = await fetchSales();
    if (callbacks.isActive() && data) {
      const ventasFormateadas = data.map((v) => ({
        id: v.id,
        fecha: new Date(v.fecha),
        tipo: "venta",
        type: "venta",
        total: Number(v.total),
        pago: v.pago,
        paymentMethod: v.pago,
        items: (v.venta_items || []).map((it) => ({
          productoId: it.producto_id,
          productId: it.producto_id,
          nombre: it.nombre,
          name: it.nombre,
          cantidad: Number(it.cantidad),
          quantity: Number(it.cantidad),
          unidad: it.unidad,
          unit: it.unidad,
          precio: Number(it.precio_unitario),
          price: Number(it.precio_unitario),
          subtotal: Number(it.subtotal),
        })),
      }));

      callbacks.setStockMovements((prev) => {
        const otros = (prev || []).filter((m) => (m.tipo || m.type) !== "venta");
        return [...ventasFormateadas, ...otros];
      });
    }
  } catch (e) {
    console.error("Error cargando ventas:", e);
  }

  try {
    const info = await loadJson<BusinessInfoData>("datos:infoNegocio");
    if (callbacks.isActive() && info) {
      callbacks.setBusinessInfo(info);
    }
  } catch (_e) {}

  if (callbacks.isActive()) {
    callbacks.setLoaded(true);
  }
}

export function useInitialLoad(
  callbacks: {
    setProducts: (products: ProductItem[]) => void;
    setStockMovements: StockMovementsSetter;
    setBusinessInfo: (info: BusinessInfoData) => void;
  },
  deps?: InitialLoadDeps,
) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let activo = true;
    runInitialLoad(
      {
        isActive: () => activo,
        setProducts: callbacks.setProducts,
        setStockMovements: callbacks.setStockMovements,
        setBusinessInfo: callbacks.setBusinessInfo,
        setLoaded,
      },
      deps,
    );
    return () => {
      activo = false;
    };
  }, [callbacks.setProducts, callbacks.setStockMovements, callbacks.setBusinessInfo, deps]);

  return {
    loaded,
    cargado: loaded,
    setLoaded,
    setCargado: setLoaded,
  };
}

export default useInitialLoad;
