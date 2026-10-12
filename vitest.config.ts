import { defineConfig } from "vitest/config";

// Standalone on purpose: the app build config wires a React plugin, a PWA plugin that scans the
// service worker, and a path-resolution plugin, none of which unit tests over pure functions need.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
