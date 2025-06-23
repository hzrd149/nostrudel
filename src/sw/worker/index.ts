/// <reference lib="webworker" />
import { setupErrorHandling } from "./error-handler";
import { initializeCache, registerCacheHandlers } from "./cache";
import debug from "debug";

// Enable all debug logs for worker
debug.enable("noStrudel:*");

declare let self: ServiceWorkerGlobalScope;

// Initialize error handling
setupErrorHandling();

console.log("Service worker initializing...");

// Initialize cache management
initializeCache();

// Register cache RPC handlers
registerCacheHandlers();

// Check if we're in development mode for fetch handling
const isDev = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
console.log("Development mode:", isDev);

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
