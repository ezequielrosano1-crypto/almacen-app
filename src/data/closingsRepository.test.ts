import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ClosingSummary } from "../types/domain";

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

describe("closingsRepository", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(async () => {
    originalWindow = globalThis.window;
    const mockStorage = createMockLocalStorage();
    globalThis.window = {
      localStorage: mockStorage,
    } as unknown as Window & typeof globalThis;
    await import("../lib/storage/localStorageShim");
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("writeClosing, readClosing and listClosings round trips summary", async () => {
    const { listClosings, readClosing, writeClosing } = await import("./closingsRepository");

    const summary: ClosingSummary = {
      date: "2026-09-21",
      time: "22:00",
      total: 1500,
      salesCount: 8,
      isAutoClosed: true,
    };

    await writeClosing("cierre:2026-09-21", summary);
    const read = await readClosing("cierre:2026-09-21");
    expect(read).toEqual(summary);

    const list = await listClosings();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(summary);

    const nonExistent = await readClosing("cierre:inexistente");
    expect(nonExistent).toBeNull();
  });
});
