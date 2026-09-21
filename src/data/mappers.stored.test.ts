import { describe, expect, it } from "vitest";
import fixture from "../../test/fixtures/storage-snapshot.json";
import type {
  StoredBusinessInfo,
  StoredCashShift,
  StoredClosingSummary,
  StoredStockMovement,
} from "../types/storage";
import {
  fromStoredBusinessInfo,
  fromStoredCashShift,
  fromStoredClosingSummary,
  fromStoredStockMovement,
  toStoredBusinessInfo,
  toStoredCashShift,
  toStoredClosingSummary,
  toStoredStockMovement,
} from "./mappers";

describe("Stored payload mappers and round trip", () => {
  it("round trips movements (venta, entrada, ajuste) against storage-snapshot.json fixture", () => {
    const rawMovimientos = fixture["user:datos:movimientos"] as StoredStockMovement[];

    for (const raw of rawMovimientos) {
      const domain = fromStoredStockMovement(raw);
      expect(domain.date).toBeInstanceOf(Date);
      expect(domain.date.toISOString()).toBe(raw.fecha);

      const serialized = toStoredStockMovement(domain);
      expect(JSON.parse(JSON.stringify(serialized))).toEqual(raw);
    }
  });

  it("round trips business info against storage-snapshot.json fixture", () => {
    const rawInfo = fixture["user:datos:infoNegocio"] as StoredBusinessInfo;
    const domain = fromStoredBusinessInfo(rawInfo);

    expect(domain).toEqual({
      name: "Almacén Central",
      contact: "099000111",
    });

    const serialized = toStoredBusinessInfo(domain);
    expect(serialized).toEqual(rawInfo);
  });

  it("round trips closing summary with and without automatico flag", () => {
    const rawWithAuto = fixture["user:cierre:2026-09-20"] as StoredClosingSummary;
    const rawWithoutAuto = fixture["user:cierre:2026-09-19"] as StoredClosingSummary;

    const domainWithAuto = fromStoredClosingSummary(rawWithAuto);
    expect(domainWithAuto.isAutoClosed).toBe(true);
    expect(toStoredClosingSummary(domainWithAuto)).toEqual(rawWithAuto);

    const domainWithoutAuto = fromStoredClosingSummary(rawWithoutAuto);
    expect(domainWithoutAuto.isAutoClosed).toBeUndefined();
    expect(toStoredClosingSummary(domainWithoutAuto)).toEqual(rawWithoutAuto);
  });

  it("round trips cash shift against sandbox fixture", () => {
    const rawCash = fixture["user:caja:jornada:test"] as StoredCashShift;
    const domain = fromStoredCashShift(rawCash);

    expect(domain).toEqual({
      id: "caja-2026-09-21",
      date: "2026-09-21",
      status: "ABIERTA",
      openingTime: "08:00",
      closingTime: null,
      isAutoClosed: false,
      total: 0,
      salesCount: 0,
    });

    const serialized = toStoredCashShift(domain);
    expect(serialized).toEqual(rawCash);
  });

  it("drops unknown extra keys on read (accepted deviation) and preserves valid fields", () => {
    const withExtraKey = {
      id: 9999,
      fecha: "2026-09-21T12:00:00.000Z",
      tipo: "venta" as const,
      total: 100,
      pago: "Efectivo",
      items: [],
      extraLegacyKey: "ignorar",
    };

    const domain = fromStoredStockMovement(withExtraKey);
    // @ts-expect-error verificación de clave descartada
    expect(domain.extraLegacyKey).toBeUndefined();

    const roundTripped = toStoredStockMovement(domain);
    expect(roundTripped).not.toHaveProperty("extraLegacyKey");
  });
});
