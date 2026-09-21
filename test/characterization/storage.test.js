import { describe, expect, it } from "vitest";
import { installLocalStorageShim } from "../../src/lib/storage/localStorageShim";
import { installLegacyStorageShim } from "../legacy/storageShim";

function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("storage shim characterization parity", () => {
  it("produces identical get/set/delete/list results to legacy shim", async () => {
    const winLegacy = { localStorage: createMockLocalStorage() };
    const winNew = { localStorage: createMockLocalStorage() };

    installLegacyStorageShim(winLegacy);
    installLocalStorageShim(winNew);

    // Initial state: key not found throw
    await expect(winLegacy.storage.get("inexistente")).rejects.toThrow();
    await expect(winNew.storage.get("inexistente")).rejects.toThrow();

    // Set user key
    const legSet1 = await winLegacy.storage.set("k1", "v1", false);
    const newSet1 = await winNew.storage.set("k1", "v1", false);
    expect(newSet1).toEqual(legSet1);

    // Set shared key
    const legSet2 = await winLegacy.storage.set("s1", "v2", true);
    const newSet2 = await winNew.storage.set("s1", "v2", true);
    expect(newSet2).toEqual(legSet2);

    // Read back
    const legGet1 = await winLegacy.storage.get("k1", false);
    const newGet1 = await winNew.storage.get("k1", false);
    expect(newGet1).toEqual(legGet1);

    const legGet2 = await winLegacy.storage.get("s1", true);
    const newGet2 = await winNew.storage.get("s1", true);
    expect(newGet2).toEqual(legGet2);

    // List keys
    await winLegacy.storage.set("cierre:2026-09-20", "c1");
    await winNew.storage.set("cierre:2026-09-20", "c1");
    await winLegacy.storage.set("cierre:2026-09-21", "c2");
    await winNew.storage.set("cierre:2026-09-21", "c2");

    const legList = await winLegacy.storage.list("cierre:", false);
    const newList = await winNew.storage.list("cierre:", false);
    expect(newList).toEqual(legList);

    // Delete keys
    const legDel1 = await winLegacy.storage.delete("k1", false);
    const newDel1 = await winNew.storage.delete("k1", false);
    expect(newDel1).toEqual(legDel1);

    const legDel2 = await winLegacy.storage.delete("k1", false);
    const newDel2 = await winNew.storage.delete("k1", false);
    expect(newDel2).toEqual(legDel2);
  });
});
