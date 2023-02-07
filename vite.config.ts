import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: ["chrome89", "edge89", "firefox89", "safari15"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Personal Nostr Client",
        description: "A simple PWA nostr client",
        orientation: "portrait",
        theme_color: "#c641c4",
        categories: ["nostr"],
      },
    }),
  ],
});
