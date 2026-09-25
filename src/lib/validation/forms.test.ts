import { describe, expect, it } from "vitest";
import {
  validateBusinessInfo,
  validateProductForm,
  validateStockAdjustment,
  validateStockEntry,
} from "./forms";

describe("validateProductForm", () => {
  const valid = { nombre: "Yerba", precio: "100", stock: "5", stockMinimo: "1" };

  it("returns no errors for a fully valid form", () => {
    expect(validateProductForm(valid)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateProductForm({ ...valid, nombre: "  " })).toEqual({
      nombre: "Ingresá un nombre",
    });
  });

  it("requires a price", () => {
    expect(validateProductForm({ ...valid, precio: "" })).toEqual({
      precio: "Ingresá un precio",
    });
  });

  it("rejects a price that is not greater than 0", () => {
    expect(validateProductForm({ ...valid, precio: "0" })).toEqual({
      precio: "El precio tiene que ser mayor a 0",
    });
    expect(validateProductForm({ ...valid, precio: "-5" })).toEqual({
      precio: "El precio tiene que ser mayor a 0",
    });
  });

  it("requires stock", () => {
    expect(validateProductForm({ ...valid, stock: "" })).toEqual({
      stock: "Ingresá el stock",
    });
  });

  it("rejects negative stock", () => {
    expect(validateProductForm({ ...valid, stock: "-1" })).toEqual({
      stock: "El stock no puede ser negativo",
    });
  });

  it("requires a minimum stock", () => {
    expect(validateProductForm({ ...valid, stockMinimo: "" })).toEqual({
      stockMinimo: "Ingresá el stock mínimo",
    });
  });

  it("rejects a negative minimum stock", () => {
    expect(validateProductForm({ ...valid, stockMinimo: "-1" })).toEqual({
      stockMinimo: "El stock mínimo no puede ser negativo",
    });
  });

  it("collects errors for every invalid field at once", () => {
    expect(validateProductForm({ nombre: "", precio: "", stock: "", stockMinimo: "" })).toEqual({
      nombre: "Ingresá un nombre",
      precio: "Ingresá un precio",
      stock: "Ingresá el stock",
      stockMinimo: "Ingresá el stock mínimo",
    });
  });
});

describe("validateBusinessInfo", () => {
  it("returns no errors when the name is present", () => {
    expect(validateBusinessInfo({ nombre: "Almacén Don José" })).toEqual({});
  });

  it("requires a business name", () => {
    expect(validateBusinessInfo({ nombre: "   " })).toEqual({
      nombre: "Ingresá el nombre del almacén",
    });
  });
});

describe("validateStockEntry", () => {
  it("returns no errors for a valid quantity", () => {
    expect(validateStockEntry({ cantidad: "3" })).toEqual({});
  });

  it("requires a quantity", () => {
    expect(validateStockEntry({ cantidad: "" })).toEqual({
      cantidad: "Ingresá la cantidad",
    });
  });

  it("rejects a quantity that is not greater than 0", () => {
    expect(validateStockEntry({ cantidad: "0" })).toEqual({
      cantidad: "La cantidad tiene que ser mayor a 0",
    });
  });
});

describe("validateStockAdjustment", () => {
  it("returns no errors when stock and reason are set", () => {
    expect(validateStockAdjustment({ stockReal: "0", motivo: "Rotura" })).toEqual({});
  });

  it("requires the counted stock", () => {
    expect(validateStockAdjustment({ stockReal: "", motivo: "Rotura" })).toEqual({
      stockReal: "Ingresá el stock contado",
    });
  });

  it("rejects negative counted stock", () => {
    expect(validateStockAdjustment({ stockReal: "-1", motivo: "Rotura" })).toEqual({
      stockReal: "El stock no puede ser negativo",
    });
  });

  it("requires a reason", () => {
    expect(validateStockAdjustment({ stockReal: "5", motivo: null })).toEqual({
      motivo: "Elegí un motivo",
    });
  });

  it("collects errors for every invalid field at once", () => {
    expect(validateStockAdjustment({ stockReal: "", motivo: null })).toEqual({
      stockReal: "Ingresá el stock contado",
      motivo: "Elegí un motivo",
    });
  });
});
