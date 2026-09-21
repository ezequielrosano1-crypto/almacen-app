import { useEffect } from "react";
import { listSaleItems as defaultListSaleItems } from "../data/salesRepository";
import { supabase } from "../data/supabaseClient";

export interface RealtimeStockMovementPayload {
  id: number | string;
  fecha: string;
  tipo: string;
  producto_id?: number | string;
  cantidad?: number | string;
  unidad?: string;
  diferencia?: number | string;
  motivo?: string;
  [key: string]: unknown;
}

export interface RealtimeSalePayload {
  id: number | string;
  fecha: string;
  total: number | string;
  pago: string;
  [key: string]: unknown;
}

export function handleStockMovementRealtimeInsert(
  movimiento: RealtimeStockMovementPayload | null | undefined,
  setMovements: (updater: (prev: any[]) => any[]) => void,
) {
  if (!movimiento || movimiento.tipo === "venta") return;

  // BUG #2: en movimientos-stock-realtime no se deduplica contra prev.
  // Esto genera una entrada gemela duplicada ("duplicated twin entrada")
  // observable en el historial de movimientos cuando se registra localmente e inserta en Supabase.
  const movimientoFormateado = {
    id: movimiento.id,
    fecha: new Date(movimiento.fecha),
    date: new Date(movimiento.fecha),
    tipo: movimiento.tipo,
    type: movimiento.tipo,
    productoId: movimiento.producto_id,
    productId: movimiento.producto_id,
    cantidad: Number(movimiento.cantidad ?? 0),
    quantity: Number(movimiento.cantidad ?? 0),
    unidad: movimiento.unidad,
    unit: movimiento.unidad,
    diferencia: Number(movimiento.diferencia ?? 0),
    difference: Number(movimiento.diferencia ?? 0),
    motivo: movimiento.motivo,
    reason: movimiento.motivo,
  };

  setMovements((prev) => [movimientoFormateado, ...prev]);
}

export async function handleSaleRealtimeInsert(
  venta: RealtimeSalePayload | null | undefined,
  setMovements: (updater: (prev: any[]) => any[]) => void,
  fetchItems: typeof defaultListSaleItems = defaultListSaleItems,
) {
  if (!venta) return;

  let items: any[];
  try {
    items = await fetchItems(Number(venta.id));
  } catch (error) {
    console.error("Error cargando items de venta:", error);
    return;
  }

  const ventaFormateada = {
    id: venta.id,
    fecha: new Date(venta.fecha),
    date: new Date(venta.fecha),
    tipo: "venta",
    type: "venta",
    total: Number(venta.total),
    pago: venta.pago,
    paymentMethod: venta.pago,
    items: (items || []).map((it) => ({
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
  };

  setMovements((prev) => {
    const existe = prev.some((m) => m.id === ventaFormateada.id);
    if (existe) return prev;
    return [ventaFormateada, ...prev];
  });
}

export function useStockMovementsRealtime(
  setMovements: (updater: (prev: any[]) => any[]) => void,
  deps = {
    client: supabase,
    listSaleItems: defaultListSaleItems,
  },
) {
  useEffect(() => {
    const canalStock = deps.client
      .channel("movimientos-stock-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "movimientos_stock",
          filter: "negocio_id=eq.1",
        },
        (payload: any) => {
          handleStockMovementRealtimeInsert(payload.new, setMovements);
        },
      )
      .subscribe();

    const canalVentas = deps.client
      .channel("ventas-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ventas",
          filter: "negocio_id=eq.1",
        },
        async (payload: any) => {
          await handleSaleRealtimeInsert(payload.new, setMovements, deps.listSaleItems);
        },
      )
      .subscribe();

    return () => {
      deps.client.removeChannel(canalStock);
      deps.client.removeChannel(canalVentas);
    };
  }, [setMovements, deps]);
}

export default useStockMovementsRealtime;
