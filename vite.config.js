import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: ["chrome89", "edge89", "firefox89", "safari15"],
  },
  // plugins: [
  //   VitePWA({
  //     registerType: "autoUpdate",
  //     devOptions: {
  //       enabled: true,
  //     },
  //   }),
  // ],
});
