import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Entorno node: no hay tests de componentes en este refactor. Este archivo
// existe también para que vitest NO cargue vite.config.js (y con él el plugin
// PWA), que no aporta nada a los tests.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.js"],
    globals: false,
  },
});
