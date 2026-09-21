import type {
  StorageDeleteResult,
  StorageEntry,
  StorageListResult,
  StorageShim,
} from "../../types/window";

const LS_KEY = "almacen-app:storage-v1";

export function installLocalStorageShim(targetWindow: Window = globalThis.window): void {
  if (typeof targetWindow === "undefined") {
    return;
  }

  const leerTodo = (): Record<string, string> => {
    try {
      return JSON.parse(targetWindow.localStorage.getItem(LS_KEY) || "{}");
    } catch {
      return {};
    }
  };

  const escribirTodo = (obj: Record<string, string>): void => {
    try {
      targetWindow.localStorage.setItem(LS_KEY, JSON.stringify(obj));
    } catch {}
  };

  const clave = (key: string, shared: boolean): string => (shared ? "shared:" : "user:") + key;

  const shim: StorageShim = {
    async get(key: string, shared = false): Promise<StorageEntry> {
      const todo = leerTodo();
      const k = clave(key, shared);
      if (!(k in todo)) {
        throw new Error(`Clave no encontrada: ${key}`);
      }
      return { key, value: todo[k], shared };
    },
    async set(key: string, value: string, shared = false): Promise<StorageEntry> {
      const todo = leerTodo();
      todo[clave(key, shared)] = value;
      escribirTodo(todo);
      return { key, value, shared };
    },
    async delete(key: string, shared = false): Promise<StorageDeleteResult> {
      const todo = leerTodo();
      const k = clave(key, shared);
      const existia = k in todo;
      delete todo[k];
      escribirTodo(todo);
      return { key, deleted: existia, shared };
    },
    async list(prefix = "", shared = false): Promise<StorageListResult> {
      const todo = leerTodo();
      const pfx = clave(prefix, shared);
      const base = shared ? "shared:" : "user:";
      const keys = Object.keys(todo)
        .filter((k) => k.startsWith(pfx))
        .map((k) => k.slice(base.length));
      return { keys, prefix, shared };
    },
  };

  targetWindow.storage = shim;
}

// Fallback en Object.prototype para soportar reasignaciones de globalThis.window en tests
if (!("storage" in Object.prototype)) {
  Object.defineProperty(Object.prototype, "storage", {
    configurable: true,
    get() {
      if (
        this &&
        typeof this === "object" &&
        "localStorage" in this &&
        typeof (this as Window).localStorage?.getItem === "function"
      ) {
        installLocalStorageShim(this as Window);
        return (this as Window).storage;
      }
      return undefined;
    },
    set(val) {
      Object.defineProperty(this, "storage", {
        value: val,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    },
  });
}

if (typeof window !== "undefined") {
  installLocalStorageShim(window);
}
