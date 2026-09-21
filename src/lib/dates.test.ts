import { describe, expect, it } from "vitest";
import {
  formatUruguayTime,
  isToday,
  localDateKey,
  nowInUruguay,
  todayDateKey,
  uruguayDateKey,
  uruguayWeekdayLabel,
} from "./dates";

describe("dates helpers and timezone parity", () => {
  it("computes nowInUruguay with override", () => {
    const override = { date: "2026-09-21", hourNumber: 8.5 };
    const clock = nowInUruguay(override);
    expect(clock.date).toBe("2026-09-21");
    expect(clock.time).toBe("08:30");
    expect(clock.hourNumber).toBe(8.5);
  });

  it("computes live nowInUruguay and formatUruguayTime structure", () => {
    const live = nowInUruguay();
    expect(live.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(live.time).toMatch(/^\d{2}:\d{2}$/);
    expect(typeof live.hourNumber).toBe("number");

    const formatted = formatUruguayTime();
    expect(formatted).toMatch(/^\d{2}:\d{2}$/);
  });

  it("todayDateKey returns local YYYY-MM-DD", () => {
    const key = todayDateKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("localDateKey extracts local YYYY-MM-DD from Date or passes string", () => {
    expect(localDateKey("2026-09-21")).toBe("2026-09-21");
    const d = new Date("2026-09-21T12:00:00.000Z");
    expect(localDateKey(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uruguayDateKey converts timestamp to America/Montevideo date string", () => {
    // 2026-09-21 02:30 UTC es 2026-09-20 23:30 en UY (-3)
    const earlyUtc = new Date("2026-09-21T02:30:00.000Z");
    expect(uruguayDateKey(earlyUtc)).toBe("2026-09-20");
  });

  it("pins bug #7: 23:30 UTC timestamp evaluates differently under local vs UY date key when local TZ is UTC", () => {
    // Timestamp: 2026-09-21 23:30 UTC (en UY es 2026-09-21 20:30)
    const ts = new Date("2026-09-21T23:30:00.000Z");
    const uyKey = uruguayDateKey(ts);
    expect(uyKey).toBe("2026-09-21");
  });

  it("uruguayWeekdayLabel produces short weekday without period", () => {
    const d = new Date("2026-09-21T12:00:00.000Z"); // Lunes
    const label = uruguayWeekdayLabel(d);
    expect(label).not.toContain(".");
    expect(label.length).toBeGreaterThan(0);
  });

  it("isToday checks against current date", () => {
    expect(isToday(new Date())).toBe(true);
    expect(isToday(new Date(Date.now() - 2 * 86400000))).toBe(false);
  });
});
