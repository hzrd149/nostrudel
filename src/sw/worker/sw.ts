/// <reference lib="webworker" />
import debug from "debug";
import { createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { initializeCache, registerCacheHandlers } from "./cache";
import { setupErrorHandling } from "./error-handler";
import { CAP_IS_WEB } from "../../env";

// Enable all debug logs for worker
debug.enable("noStrudel:*");

declare let self: ServiceWorkerGlobalScope;

// Initialize error handling
setupErrorHandling();

console.log("Service worker initializing...");

// Only initialize cache management if running on web
if (CAP_IS_WEB) {
  console.log("Running on web platform - initializing offline cache");
  // Initialize cache management
  initializeCache();

  // Register cache RPC handlers
  registerCacheHandlers();

  // Register navigation route for SPA fallback
  // Only allow the root path in development to avoid intercepting all routes
  let allowlist: undefined | RegExp[];
  if (import.meta.env.DEV) {
    allowlist = [/^\/$/];
  }

  // Handle navigation requests - fallback to index.html for React Router
  registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist }));
} else {
  console.log("Running on native platform - offline cache is not needed");
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Service worker lifecycle events
self.addEventListener("install", (event) => {
  console.log("Service worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
});

console.log("Service worker initialization completed");
