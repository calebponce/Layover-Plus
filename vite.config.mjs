import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:3000";
const portfolioDemoMode = process.env.VITE_DEMO_MODE === "true";
const appEntry = portfolioDemoMode ? "./src/client/entry.demo.jsx" : "./src/client/entry.app.jsx";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  resolve: {
    alias: {
      "@app-entry": fileURLToPath(new URL(appEntry, import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "LayoverPlus",
        short_name: "LayoverPlus",
        description: "AI-Assisted Layover Planning",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        icons: [
          {
            src: "layover-mark.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
