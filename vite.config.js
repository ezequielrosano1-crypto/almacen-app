import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.png",
        "icon-192.png",
        "icon-512.png",
        "brand/isotipo.png",
        "brand/isotipo-white.png",
        "brand/logo.png",
        "brand/logo-white.png",
      ],
      manifest: {
        name: "STOCKIA",
        short_name: "STOCKIA",
        description: "Inventario, ventas y gestión para tu negocio",
        theme_color: "#0F172A",
        background_color: "#F5F7FB",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
