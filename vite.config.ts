import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

console.log("Build with:");
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith("VITE_")) console.log(`${key}: ${value}`);
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  build: {
    target: ["chrome89", "edge89", "firefox89", "safari15"],
    sourcemap: true,
    rollupOptions: {
      output: {
        // don't create any chunks smaller than 500kB
        experimentalMinChunkSize: 1024 * 100,
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      strategies: "injectManifest",
      registerType: "autoUpdate",
      injectRegister: null,
      srcDir: "src",
      filename: "worker.ts",
      injectManifest: {
        minify: false,
        sourcemap: true,
        // This increase the cache limit to 4mB
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
      },
      workbox: {
        // This increase the cache limit to 4mB
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
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
            name: "Notes",
            url: "/",
            description: "",
          },
          {
            name: "Notifications",
            url: "/notifications",
            description: "",
          },
          {
            name: "Messages",
            url: "/messages",
            description: "",
          },
          {
            name: "Streams",
            url: "/streams",
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
