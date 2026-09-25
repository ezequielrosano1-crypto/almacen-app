import { describe, expect, it } from "vitest";
import { DESKTOP_NAV_ITEMS, MOBILE_NAV_ITEMS } from "./navigation";

describe("navigation config", () => {
  it("has the 7 desktop sections in the mockup order", () => {
    expect(DESKTOP_NAV_ITEMS.map((i) => i.key)).toEqual([
      "home",
      "stock",
      "sales",
      "purchases",
      "suppliers",
      "reports",
      "more",
    ]);
    expect(DESKTOP_NAV_ITEMS.every((i) => i.desktop)).toBe(true);
    expect(DESKTOP_NAV_ITEMS.find((i) => i.key === "more")?.label).toBe("Configuración");
  });

  it("has the 5 mobile bottom-bar sections, with the hub labeled Más", () => {
    expect(MOBILE_NAV_ITEMS.map((i) => i.key)).toEqual([
      "home",
      "stock",
      "sales",
      "purchases",
      "more",
    ]);
    expect(MOBILE_NAV_ITEMS.find((i) => i.key === "more")?.label).toBe("Más");
  });

  it("every nav item exposes a lucide icon component", () => {
    expect(DESKTOP_NAV_ITEMS.every((i) => i.icon != null)).toBe(true);
  });
});
