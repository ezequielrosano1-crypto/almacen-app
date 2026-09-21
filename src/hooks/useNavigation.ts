import { useState } from "react";
import type {
  NavEntry,
  NavigationActions,
  ScreenId,
  ScreenParams,
  TabId,
} from "../types/navigation";

export function getCurrentNavEntry(stack: NavEntry[]): NavEntry {
  return stack.length ? stack[stack.length - 1] : { screen: "main", params: {} };
}

export function pushNavEntry(
  stack: NavEntry[],
  screen: ScreenId,
  params: ScreenParams = {},
): NavEntry[] {
  return [...stack, { screen, params }];
}

export function popNavEntry(stack: NavEntry[]): NavEntry[] {
  return stack.slice(0, -1);
}

export function resetNavStack(): NavEntry[] {
  return [];
}

export interface NavStackState {
  tab: TabId;
  stack: NavEntry[];
}

// Cambiar de pestaña vacía la pila de pantallas.
export function goTabNav(_state: NavStackState, tab: TabId): NavStackState {
  return { tab, stack: resetNavStack() };
}

// Cambiar de pestaña y abrir directamente una pantalla dentro de ella.
export function goTabScreenNav(
  _state: NavStackState,
  tab: TabId,
  screen: ScreenId,
  params: ScreenParams = {},
): NavStackState {
  return { tab, stack: [{ screen, params }] };
}

export interface UseNavigationReturn extends NavigationActions {
  tab: TabId;
  setTab: React.Dispatch<React.SetStateAction<TabId>>;
  stack: NavEntry[];
  setStack: React.Dispatch<React.SetStateAction<NavEntry[]>>;
  current: NavEntry;
}

export function useNavigation(
  initialTab: TabId = "home",
  initialStack: NavEntry[] = [],
): UseNavigationReturn {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [stack, setStack] = useState<NavEntry[]>(initialStack);

  const current = getCurrentNavEntry(stack);

  const goTab = (newTab: TabId) => {
    setTab(newTab);
    setStack(goTabNav({ tab, stack }, newTab).stack);
  };

  const goTabScreen = (newTab: TabId, screen: ScreenId, params: ScreenParams = {}) => {
    setTab(newTab);
    setStack(goTabScreenNav({ tab, stack }, newTab, screen, params).stack);
  };

  const push = (screen: ScreenId, params: ScreenParams = {}) => {
    setStack((s) => pushNavEntry(s, screen, params));
  };

  const pop = () => {
    setStack((s) => popNavEntry(s));
  };

  const resetStack = () => {
    setStack(resetNavStack());
  };

  return {
    tab,
    setTab,
    stack,
    setStack,
    current,
    goTab,
    goTabScreen,
    push,
    pop,
    resetStack,
  };
}

export default useNavigation;
