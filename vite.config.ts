import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const isProd = process.env.NODE_ENV === "production";
process.env.VITE_ANALYTICS_SCRIPT = isProd
  ? `
<script
  async defer
  src="https://ackee.nostrudel.ninja/tracker.js"
  data-ackee-server="https://ackee.nostrudel.ninja"
  data-ackee-domain-id="58b1c39f-43f9-422b-bc7d-06aff35e764e"
></script>`
  : "";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  build: {
    target: ["chrome89", "edge89", "firefox89", "safari15"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "noStrudel",
        short_name: "noStrudel",
        description: "A simple PWA nostr client",
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
