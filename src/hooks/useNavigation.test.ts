import { describe, expect, it } from "vitest";
import {
  getCurrentNavEntry,
  goTabNav,
  goTabScreenNav,
  popNavEntry,
  pushNavEntry,
  resetNavStack,
} from "./useNavigation";

describe("useNavigation / pure navigation state", () => {
  it("current is main with empty params when the stack is empty", () => {
    expect(getCurrentNavEntry([])).toEqual({ screen: "main", params: {} });
  });

  it("goTab changes the tab and clears the stack", () => {
    const next = goTabNav({ tab: "home", stack: [{ screen: "lowStock", params: {} }] }, "sales");
    expect(next).toEqual({ tab: "sales", stack: [] });
  });

  it("goTabScreen changes the tab and replaces the stack with one entry", () => {
    const next = goTabScreenNav({ tab: "home", stack: [] }, "stock", "lowStock");
    expect(next).toEqual({ tab: "stock", stack: [{ screen: "lowStock", params: {} }] });
    const withParams = goTabScreenNav(next, "stock", "productDetail", { productId: 3 });
    expect(withParams.stack).toEqual([{ screen: "productDetail", params: { productId: 3 } }]);
  });

  it("push appends and pop restores the previous screen with its params", () => {
    let stack = pushNavEntry([], "productCatalog");
    stack = pushNavEntry(stack, "productDetail", { productId: 5 });
    expect(getCurrentNavEntry(stack)).toEqual({
      screen: "productDetail",
      params: { productId: 5 },
    });
    stack = popNavEntry(stack);
    expect(getCurrentNavEntry(stack)).toEqual({ screen: "productCatalog", params: {} });
    expect(popNavEntry(popNavEntry(stack))).toEqual([]);
  });

  it("resetStack returns an empty stack", () => {
    expect(resetNavStack()).toEqual([]);
  });
});
