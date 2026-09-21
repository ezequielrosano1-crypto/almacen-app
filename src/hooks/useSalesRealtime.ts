import { useEffect } from "react";
import { listSaleItems as defaultListSaleItems } from "../data/salesRepository";
import { supabase } from "../data/supabaseClient";

export interface RealtimeSalePayload {
  id: number | string;
  fecha: string;
  total: number | string;
  pago: string;
  [key: string]: unknown;
}

export async function handleSaleRealtimeInsert(
  venta: RealtimeSalePayload | null | undefined,
  setMovements: (updater: (prev: any[]) => any[]) => void,
  fetchItems: typeof defaultListSaleItems = defaultListSaleItems,
) {
  if (!venta) return;

  // El handler es async: espera los items ANTES de actualizar el estado.
  let items: any[];
  try {
    items = await fetchItems(Number(venta.id));
  } catch (error) {
    console.error("Error cargando items de venta:", error);
    return;
  }

  // BUG #4: si items llega vacío ([]) se registra igual una venta con items: [].
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

export function useSalesRealtime(
  setMovements: (updater: (prev: any[]) => any[]) => void,
  client = supabase,
  listSaleItems = defaultListSaleItems,
) {
  useEffect(() => {
    const canalVentas = client
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
          await handleSaleRealtimeInsert(payload.new, setMovements, listSaleItems);
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(canalVentas);
    };
  }, [setMovements, client, listSaleItems]);
}

export default useSalesRealtime;
