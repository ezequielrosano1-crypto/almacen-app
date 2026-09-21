import { describe, expect, it, vi } from "vitest";

describe("nextId", () => {
  it("pins bug #1: starts at 1000, increments by 1, and restarts at 1000 after vi.resetModules()", async () => {
    vi.resetModules();
    const { nextId: nextId1 } = await import("./ids");
    expect(nextId1()).toBe(1000);
    expect(nextId1()).toBe(1001);
    expect(nextId1()).toBe(1002);

    vi.resetModules();
    const { nextId: nextId2 } = await import("./ids");
    expect(nextId2()).toBe(1000);
    expect(nextId2()).toBe(1001);
  });
});
