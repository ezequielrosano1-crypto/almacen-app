import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listKeys, readJson, removeKey, writeJson } from "./storage";

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

describe("storage facade", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(async () => {
    originalWindow = globalThis.window;
    const mockStorage = createMockLocalStorage();
    globalThis.window = {
      localStorage: mockStorage,
    } as unknown as Window & typeof globalThis;
    await import("./localStorageShim");
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("writeJson and readJson round trips data and throws on missing key", async () => {
    await writeJson("test:obj", { a: 1, b: "hola" });
    const read = await readJson<{ a: number; b: string }>("test:obj");
    expect(read).toEqual({ a: 1, b: "hola" });

    await expect(readJson("no:existe")).rejects.toThrow("Clave no encontrada: no:existe");
  });

  it("listKeys lists keys matching prefix", async () => {
    await writeJson("prefix:1", "uno");
    await writeJson("prefix:2", "dos");
    await writeJson("other:3", "tres");

    const keys = await listKeys("prefix:");
    expect(keys).toContain("prefix:1");
    expect(keys).toContain("prefix:2");
    expect(keys).not.toContain("other:3");
  });

  it("removeKey deletes a key and returns deleted status", async () => {
    await writeJson("eliminar", "ok");
    const r1 = await removeKey("eliminar");
    expect(r1.deleted).toBe(true);

    const r2 = await removeKey("eliminar");
    expect(r2.deleted).toBe(false);
  });
});
