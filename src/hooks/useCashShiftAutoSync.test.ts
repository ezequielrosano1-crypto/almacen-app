import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../data/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));

import { CASH_SHIFT_SYNC_INTERVAL_MS, startCashShiftAutoSync } from "./useCashShiftAutoSync";

describe("useCashShiftAutoSync / startCashShiftAutoSync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uses a 30000 ms interval", () => {
    expect(CASH_SHIFT_SYNC_INTERVAL_MS).toBe(30000);
  });

  it("syncs on start and then every 30000 ms", async () => {
    const shift = { id: "caja-1" };
    const sync = vi.fn().mockResolvedValue(shift);
    const setCashShift = vi.fn();
    const movements = [{ id: 1 }] as never[];
    startCashShiftAutoSync(movements, setCashShift, sync);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(movements);
    await vi.advanceTimersByTimeAsync(30000);
    expect(sync).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(60000);
    expect(sync).toHaveBeenCalledTimes(4);
    expect(setCashShift).toHaveBeenCalledWith(shift);
  });

  it("cleanup stops the interval and ignores in-flight results", async () => {
    let resolve!: (v: unknown) => void;
    const sync = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const setCashShift = vi.fn();
    const stop = startCashShiftAutoSync([], setCashShift, sync);
    stop();
    resolve({ id: "late" });
    await vi.advanceTimersByTimeAsync(90000);
    expect(setCashShift).not.toHaveBeenCalled();
    expect(sync).toHaveBeenCalledTimes(1);
  });
});
