/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { setupErrorHandling } from "./error-handler";

declare let self: ServiceWorkerGlobalScope;

// Initialize error handling
setupErrorHandling();

console.log("Service worker initializing...");

// Clean up outdated caches and precache assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Check if we're in development mode for fetch handling
const isDev = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
console.log("Development mode:", isDev);

// Auto-update behavior: take control of all pages immediately
self.skipWaiting();
clientsClaim();

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
