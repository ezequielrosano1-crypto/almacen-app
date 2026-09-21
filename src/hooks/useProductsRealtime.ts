import { useEffect } from "react";
import { supabase } from "../data/supabaseClient";
import type { ProductItem } from "./useProducts";

export interface RealtimeProductPayload {
  eventType: string;
  old?: { id: number | string; [key: string]: unknown };
  new?: {
    id: number | string;
    nombre: string;
    precio: number | string;
    unidad: string;
    stock: number | string;
    stock_minimo: number | string;
    codigo_barras?: string | null;
    [key: string]: unknown;
  };
}

export function handleProductRealtimeEvent(
  payload: RealtimeProductPayload,
  setProducts: (updater: (prev: ProductItem[]) => ProductItem[]) => void,
) {
  const producto = payload.new;

  if (payload.eventType === "DELETE") {
    if (payload.old?.id !== undefined) {
      setProducts((prev) => prev.filter((p) => p.id !== payload.old?.id));
    }
    return;
  }

  if (producto) {
    // BUG #6: en realtime se preserva codigoBarras / barcode como "" cuando codigo_barras es null
    const barcodeValue = producto.codigo_barras || "";
    const productoFormateado = {
      id: producto.id,
      nombre: producto.nombre,
      name: producto.nombre,
      precio: Number(producto.precio),
      price: Number(producto.precio),
      unidad: producto.unidad,
      unit: producto.unidad,
      stock: Number(producto.stock),
      stockMinimo: Number(producto.stock_minimo),
      minimumStock: Number(producto.stock_minimo),
      codigoBarras: barcodeValue,
      barcode: barcodeValue,
    };

    setProducts((prev) => {
      const existe = prev.some((p) => p.id === productoFormateado.id);
      return existe
        ? prev.map((p) => (p.id === productoFormateado.id ? productoFormateado : p))
        : [...prev, productoFormateado];
    });
  }
}

export function useProductsRealtime(
  setProducts: (updater: (prev: ProductItem[]) => ProductItem[]) => void,
  client = supabase,
) {
  useEffect(() => {
    const canal = client
      .channel("productos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "productos",
          filter: "negocio_id=eq.1",
        },
        (payload: unknown) => {
          handleProductRealtimeEvent(payload as RealtimeProductPayload, setProducts);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(canal);
    };
  }, [setProducts, client]);
}

export default useProductsRealtime;
