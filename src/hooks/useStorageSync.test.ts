import { describe, expect, it, vi } from "vitest";
import { persistWhenLoaded } from "./useStorageSync";

describe("useStorageSync / persistWhenLoaded", () => {
  it("does not write before the initial load finished", () => {
    const write = vi.fn().mockResolvedValue(undefined);
    persistWhenLoaded(false, "datos:movimientos", [1], write);
    expect(write).not.toHaveBeenCalled();
  });

  it("writes key and value once loaded", () => {
    const write = vi.fn().mockResolvedValue(undefined);
    persistWhenLoaded(true, "datos:infoNegocio", { a: 1 }, write);
    expect(write).toHaveBeenCalledWith("datos:infoNegocio", { a: 1 });
  });

  it("swallows write failures", async () => {
    const write = vi.fn().mockRejectedValue(new Error("boom"));
    expect(() => persistWhenLoaded(true, "k", 1, write)).not.toThrow();
    await Promise.resolve();
  });
});
