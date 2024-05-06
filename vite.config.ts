import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  build: {
    target: ["chrome89", "edge89", "firefox89", "safari15"],
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      // strategies: "injectManifest",
      // srcDir: "src",
      // filename: "sw.ts",
      // devOptions: {
      //   // NOTE: ESM service workers is not supported by firefox
      //   type: "module",
      //   enabled: true,
      // },
      workbox: {
        // This increase the cache limit to 3mB
        maximumFileSizeToCacheInBytes: 2097152 * 1.5,
      },
      manifest: {
        name: "noStrudel",
        short_name: "noStrudel",
        description: "A sandbox for exploring nostr",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#8DB600",
        categories: ["social"],
        icons: [
          { src: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
          { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
          { src: "/icon-192-maskable.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
          { src: "/icon-512-maskable.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
        ],
        lang: "en",
        start_url: "/",
        scope: "/",
        shortcuts: [
          {
            name: "Notifications",
            url: "/#/notifications",
            description: "",
          },
          {
            name: "Notes",
            url: "/#/",
            description: "",
          },
          {
            name: "Notifications",
            url: "/#/notifications",
            description: "",
          },
          {
            name: "Messages",
            url: "/#/dm",
            description: "",
          },
          {
            name: "Streams",
            url: "/#/streams",
            description: "",
          },
          {
            name: "Wiki",
            url: "/#/wiki",
            description: "",
          },
        ],
        protocol_handlers: [
          {
            protocol: "web+nostr",
            url: "/l/%s",
          },
          {
            protocol: "nostr",
            url: "/l/%s",
          },
        ],
      },
    }),
  ],
});
