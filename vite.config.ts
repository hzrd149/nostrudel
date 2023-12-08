import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isProd = process.env.NODE_ENV === "production";
process.env.VITE_ANALYTICS_SCRIPT =
  isProd && process.env.ACKEE_DOMAIN_ID
    ? `
<script
  async defer
  src="//ackee.nostrudel.ninja/tracker.js"
  data-ackee-server="//ackee.nostrudel.ninja"
  data-ackee-domain-id="${process.env.ACKEE_DOMAIN_ID}"
></script>`
    : "";

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
      workbox: {
        // This is a temporary measure to increase the cache limit to 3mB
        // TODO: Remove this when the 200kB gif is removed from @getalby/bitcoin-connect-react
        maximumFileSizeToCacheInBytes: 2097152 * 1.5,
      },
      manifest: {
        name: "noStrudel",
        short_name: "noStrudel",
        description: "A sandbox for exploring nostr",
        orientation: "any",
        theme_color: "#8DB600",
        categories: ["nostr"],
        icons: [
          { src: "/favicon.ico", type: "image/x-icon", sizes: "16x16 32x32" },
          { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
          { src: "/icon-192-maskable.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
          { src: "/icon-512-maskable.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
        ],
        // TODO: actually handle this share data
        // @ts-ignore
        share_target: {
          action: "/share",
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
      },
    }),
  ],
});
