// Snapshot verbatim de window.storage de src/App.jsx (líneas 32-74)
// Utilizado como oráculo inmutable para pruebas de caracterización (D8).
// NO EDITAR este archivo.

export function installLegacyStorageShim(targetWindow = globalThis.window) {
  if (typeof targetWindow !== "undefined" && !targetWindow.storage) {
    const LS_KEY = "almacen-app:storage-v1";
    const leerTodo = () => {
      try {
        return JSON.parse(targetWindow.localStorage.getItem(LS_KEY) || "{}");
      } catch (_e) {
        return {};
      }
    };
    const escribirTodo = (obj) => {
      try {
        targetWindow.localStorage.setItem(LS_KEY, JSON.stringify(obj));
      } catch (_e) {}
    };
    const clave = (key, shared) => (shared ? "shared:" : "user:") + key;

    targetWindow.storage = {
      async get(key, shared = false) {
        const todo = leerTodo();
        const k = clave(key, shared);
        if (!(k in todo)) throw new Error(`Clave no encontrada: ${key}`);
        return { key, value: todo[k], shared };
      },
      async set(key, value, shared = false) {
        const todo = leerTodo();
        todo[clave(key, shared)] = value;
        escribirTodo(todo);
        return { key, value, shared };
      },
      async delete(key, shared = false) {
        const todo = leerTodo();
        const k = clave(key, shared);
        const existia = k in todo;
        delete todo[k];
        escribirTodo(todo);
        return { key, deleted: existia, shared };
      },
      async list(prefix = "", shared = false) {
        const todo = leerTodo();
        const pfx = clave(prefix, shared);
        const base = shared ? "shared:" : "user:";
        const keys = Object.keys(todo)
          .filter((k) => k.startsWith(pfx))
          .map((k) => k.slice(base.length));
        return { keys, prefix, shared };
      },
    };
  }
}
