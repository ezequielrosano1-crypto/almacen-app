import { describe, expect, it } from "vitest";
import { applyBusinessInfoSave, DEFAULT_BUSINESS_INFO } from "./useBusinessInfo";

describe("useBusinessInfo pure functions", () => {
  it("has expected default business info", () => {
    expect(DEFAULT_BUSINESS_INFO.nombre).toBe("Almacén de la familia");
    expect(DEFAULT_BUSINESS_INFO.contacto).toBe("099 123 456");
    expect(DEFAULT_BUSINESS_INFO.name).toBe("Almacén de la familia");
    expect(DEFAULT_BUSINESS_INFO.contact).toBe("099 123 456");
  });

  it("applyBusinessInfoSave updates Spanish and English fields", () => {
    const updated = applyBusinessInfoSave(DEFAULT_BUSINESS_INFO, {
      nombre: "Almacén Don José",
      contacto: "098 765 432",
    });

    expect(updated.nombre).toBe("Almacén Don José");
    expect(updated.contacto).toBe("098 765 432");
    expect(updated.name).toBe("Almacén Don José");
    expect(updated.contact).toBe("098 765 432");
  });

  it("applyBusinessInfoSave handles English fields input", () => {
    const updated = applyBusinessInfoSave(DEFAULT_BUSINESS_INFO, {
      name: "Supermercado Central",
      contact: "091 222 333",
    });

    expect(updated.nombre).toBe("Supermercado Central");
    expect(updated.contacto).toBe("091 222 333");
    expect(updated.name).toBe("Supermercado Central");
    expect(updated.contact).toBe("091 222 333");
  });
});
