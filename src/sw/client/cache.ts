// Utility functions to interact with service worker cache using RPC
import type { CachedFile, CacheInfo } from "../worker/cache";
import { serviceWorkerRPC } from "./rpc";
import { firstValueFrom } from "rxjs";

const client = serviceWorkerRPC;

// Get all cached files from all caches
export const getAllCachedFiles = async (): Promise<CacheInfo[]> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.getAll", void 0));
};

// Get cached files for a specific cache
export const getCachedFilesByName = async (cacheName: string): Promise<CachedFile[]> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.getByName", { cacheName }));
};

// Clear a specific cache
export const clearCache = async (cacheName: string): Promise<void> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.clear", { cacheName }));
};

// Clear all caches
export const clearAllCaches = async (): Promise<string[]> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.clearAll", void 0));
};

// Get cache statistics
export const getCacheStats = async (): Promise<{ totalCaches: number; totalFiles: number; totalSize: number }> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.getStats", void 0));
};

// Refresh offline cache
export const refreshOfflineCache = async (): Promise<number> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("cache.refresh", void 0));
};

// Helper function to format file size
export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "Unknown";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

// Helper function to format cache name for display
export const formatCacheName = (cacheName: string): string => {
  // Remove common cache prefixes for cleaner display
  return cacheName
    .replace(/^workbox-precache-v\d+-/, "Precache v")
    .replace(/^workbox-runtime-/, "Runtime ")
    .replace(/^workbox-/, "");
};
