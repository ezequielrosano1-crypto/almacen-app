import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Helper para crear un almacenamiento falso en memoria compatible con Storage
function createMockLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("localStorageShim", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = globalThis.window;
    const mockStorage = createMockLocalStorage();
    globalThis.window = {
      localStorage: mockStorage,
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("installs window.storage and throws on missing key", async () => {
    await import("./localStorageShim");
    expect(window.storage).toBeDefined();

    await expect(window.storage.get("inexistente")).rejects.toThrow(
      "Clave no encontrada: inexistente",
    );
  });

  it("handles user and shared key prefixes and return shapes", async () => {
    await import("./localStorageShim");
    const userRes = await window.storage.set("testKey", "valor1", false);
    expect(userRes).toEqual({
      key: "testKey",
      value: "valor1",
      shared: false,
    });

    const sharedRes = await window.storage.set("sharedKey", "valor2", true);
    expect(sharedRes).toEqual({
      key: "sharedKey",
      value: "valor2",
      shared: true,
    });

    const readUser = await window.storage.get("testKey", false);
    expect(readUser.value).toBe("valor1");

    const readShared = await window.storage.get("sharedKey", true);
    expect(readShared.value).toBe("valor2");
  });

  it("lists keys with prefix slicing correctly", async () => {
    await import("./localStorageShim");
    await window.storage.set("cierre:2026-09-20", "data1");
    await window.storage.set("cierre:2026-09-21", "data2");
    await window.storage.set("datos:info", "info");

    const listRes = await window.storage.list("cierre:", false);
    expect(listRes.keys).toContain("cierre:2026-09-20");
    expect(listRes.keys).toContain("cierre:2026-09-21");
    expect(listRes.keys).not.toContain("datos:info");
  });

  it("handles delete with return shape and existence flag", async () => {
    await import("./localStorageShim");
    await window.storage.set("borrar", "123");

    const del1 = await window.storage.delete("borrar");
    expect(del1).toEqual({ key: "borrar", deleted: true, shared: false });

    const del2 = await window.storage.delete("borrar");
    expect(del2).toEqual({ key: "borrar", deleted: false, shared: false });
  });

  it("handles corrupt JSON in localStorage returning {}", async () => {
    window.localStorage.setItem("almacen-app:storage-v1", "{ corrupt-json");
    await import("./localStorageShim");
    await expect(window.storage.get("algo")).rejects.toThrow("Clave no encontrada: algo");
  });
});
