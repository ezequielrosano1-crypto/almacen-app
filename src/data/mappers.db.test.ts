import { describe, expect, it } from "vitest";
import {
  legacyToCashShift,
  legacyToProduct,
  legacyToProductFromRealtime,
  legacyToProductUpsert,
  legacyToSale,
  legacyToSaleItem,
  legacyToStockMovementFromRealtime,
} from "../../test/legacy/mappers";
import type {
  CashShiftRow,
  ProductRow,
  SaleItemRow,
  SaleWithItemsRow,
  StockMovementRow,
} from "../types/db";
import type { Product } from "../types/domain";
import {
  toCashShift,
  toProduct,
  toProductFromRealtime,
  toProductUpsert,
  toSaleItem,
  toSaleMovement,
  toSaleMovementFromRealtime,
  toStockMovementFromRealtime,
} from "./mappers";

describe("DB mappers", () => {
  const sampleProductRow: ProductRow = {
    id: 12,
    negocio_id: 1,
    nombre: "Yerba Mate 1kg",
    precio: 180,
    unidad: "unidad",
    stock: 25,
    stock_minimo: 5,
    codigo_barras: null,
  };

  it("pins bug #6: barcode is null on toProduct but empty string on toProductFromRealtime", () => {
    const product = toProduct(sampleProductRow);
    const realtimeProduct = toProductFromRealtime(sampleProductRow);

    expect(product.barcode).toBeNull();
    expect(realtimeProduct.barcode).toBe("");
    expect(realtimeProduct.barcode).toBe(
      legacyToProductFromRealtime(sampleProductRow).codigoBarras,
    );

    // Con código de barras presente, ambos preservan el valor
    const withBarcode: ProductRow = {
      ...sampleProductRow,
      codigo_barras: "7730123456789",
    };
    expect(toProduct(withBarcode).barcode).toBe("7730123456789");
    expect(toProductFromRealtime(withBarcode).barcode).toBe("7730123456789");
    expect(toProductFromRealtime(withBarcode).barcode).toBe(
      legacyToProductFromRealtime(withBarcode).codigoBarras,
    );
  });

  it("toProduct parity with legacyToProduct (rename only + coercions)", () => {
    const rowWithStringNumbers: ProductRow = {
      id: "prod-1",
      negocio_id: 1,
      nombre: "Azúcar 1kg",
      // @ts-expect-error simula respuesta de Supabase con números como string
      precio: "65.5",
      unidad: "unidad",
      // @ts-expect-error simula respuesta de Supabase
      stock: "40",
      // @ts-expect-error simula respuesta de Supabase
      stock_minimo: "10",
      codigo_barras: null,
    };

    const domain = toProduct(rowWithStringNumbers);
    const legacy = legacyToProduct(rowWithStringNumbers);

    expect(domain.id).toBe(legacy.id);
    expect(domain.name).toBe(legacy.nombre);
    expect(domain.price).toBe(legacy.precio);
    expect(domain.unit).toBe(legacy.unidad);
    expect(domain.stock).toBe(legacy.stock);
    expect(domain.minimumStock).toBe(legacy.stockMinimo);
    expect(domain.barcode).toBe(legacy.codigoBarras);
  });

  it("toProductUpsert maps domain Product to DB payload with negocio_id: 1 and barcode fallback", () => {
    const productWithoutBarcode: Product = {
      id: 5,
      name: "Galletitas",
      price: 45,
      unit: "unidad",
      stock: 15,
      minimumStock: 3,
      barcode: "",
    };

    const upsert1 = toProductUpsert(productWithoutBarcode);
    expect(upsert1).toEqual({
      id: 5,
      negocio_id: 1,
      nombre: "Galletitas",
      precio: 45,
      unidad: "unidad",
      stock: 15,
      stock_minimo: 3,
      codigo_barras: null,
    });

    const legacy1 = legacyToProductUpsert({
      id: productWithoutBarcode.id,
      nombre: productWithoutBarcode.name,
      precio: productWithoutBarcode.price,
      unidad: productWithoutBarcode.unit,
      stock: productWithoutBarcode.stock,
      stockMinimo: productWithoutBarcode.minimumStock,
      codigoBarras: productWithoutBarcode.barcode,
    });
    expect(upsert1).toEqual(legacy1);
  });

  it("toSaleItem and toSaleMovement map nested sale rows with Date parsing", () => {
    const itemRow: SaleItemRow = {
      id: 101,
      venta_id: 50,
      producto_id: 12,
      nombre: "Yerba Mate",
      cantidad: 2,
      unidad: "unidad",
      precio_unitario: 180,
      subtotal: 360,
    };

    const itemDomain = toSaleItem(itemRow);
    const itemLegacy = legacyToSaleItem(itemRow);

    expect(itemDomain).toEqual({
      productId: itemLegacy.productoId,
      name: itemLegacy.nombre,
      quantity: itemLegacy.cantidad,
      unit: itemLegacy.unidad,
      price: itemLegacy.precio,
      subtotal: itemLegacy.subtotal,
    });

    const saleRow: SaleWithItemsRow = {
      id: 50,
      negocio_id: 1,
      fecha: "2026-09-21T14:00:00.000Z",
      total: 360,
      pago: "Efectivo",
      venta_items: [itemRow],
    };

    const saleDomain = toSaleMovement(saleRow);
    const saleLegacy = legacyToSale(saleRow);

    expect(saleDomain.id).toBe(saleLegacy.id);
    expect(saleDomain.date).toEqual(saleLegacy.fecha);
    expect(saleDomain.type).toBe("venta");
    expect(saleDomain.total).toBe(saleLegacy.total);
    expect(saleDomain.paymentMethod).toBe(saleLegacy.pago);
    expect(saleDomain.items).toHaveLength(1);
    expect(saleDomain.items[0]).toEqual(itemDomain);

    const saleRealtime = toSaleMovementFromRealtime(
      {
        id: saleRow.id,
        negocio_id: saleRow.negocio_id,
        jornada_id: null,
        fecha: saleRow.fecha,
        total: saleRow.total,
        pago: saleRow.pago,
      },
      [itemRow],
    );
    expect(saleRealtime).toEqual(saleDomain);
  });

  it("toStockMovementFromRealtime yields no productName and difference Number(null)===0", () => {
    const stockRowEntrada: StockMovementRow = {
      id: 701,
      negocio_id: 1,
      producto_id: 12,
      jornada_id: null,
      fecha: "2026-09-21T11:00:00.000Z",
      tipo: "entrada",
      cantidad: 10,
      unidad: "unidad",
      diferencia: null,
      motivo: null,
    };

    const entradaDomain = toStockMovementFromRealtime(stockRowEntrada);
    const entradaLegacy = legacyToStockMovementFromRealtime(stockRowEntrada);

    expect(entradaLegacy.diferencia).toBe(0); // Number(null) === 0
    expect(entradaDomain.type).toBe("entrada");
    if (entradaDomain.type === "entrada") {
      expect(entradaDomain.difference).toBe(0);
      expect(entradaDomain.productName).toBeUndefined();
      expect(entradaDomain.productId).toBe(12);
      expect(entradaDomain.quantity).toBe(10);
    }

    const stockRowAjuste: StockMovementRow = {
      id: 702,
      negocio_id: 1,
      producto_id: null,
      jornada_id: null,
      fecha: "2026-09-21T11:30:00.000Z",
      tipo: "ajuste",
      cantidad: null,
      unidad: null,
      diferencia: -3,
      motivo: "Vencimiento",
    };

    const ajusteDomain = toStockMovementFromRealtime(stockRowAjuste);
    expect(ajusteDomain.type).toBe("ajuste");
    if (ajusteDomain.type === "ajuste") {
      expect(ajusteDomain.difference).toBe(-3);
      expect(ajusteDomain.reason).toBe("Vencimiento");
      expect(ajusteDomain.productName).toBeUndefined();
    }
  });

  it("toCashShift maps DB CashShiftRow reading cerrado_automatico into isAutoClosed", () => {
    const cashRow: CashShiftRow = {
      id: "caja-2026-09-21",
      negocio_id: 1,
      fecha: "2026-09-21",
      estado: "CERRADA",
      hora_apertura: "08:00",
      hora_cierre: "22:00",
      cerrado_automatico: true,
      total: 12500,
      cantidad_ventas: 42,
    };

    const domain = toCashShift(cashRow);
    const legacy = legacyToCashShift(cashRow);

    expect(domain.id).toBe(legacy.id);
    expect(domain.date).toBe(legacy.fecha);
    expect(domain.status).toBe(legacy.estado);
    expect(domain.openingTime).toBe(legacy.horaApertura);
    expect(domain.closingTime).toBe(legacy.horaCierre);
    expect(domain.isAutoClosed).toBe(legacy.cerradoAutomaticamente);
    expect(domain.total).toBe(legacy.total);
    expect(domain.salesCount).toBe(legacy.cantidadVentas);
  });
});
