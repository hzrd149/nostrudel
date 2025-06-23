/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, getCacheKeyForURL } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { rpcServer } from "./rpc";
import { logger } from "../../helpers/debug";

declare let self: ServiceWorkerGlobalScope;

const log = logger.extend("Cache");

export interface CachedFile {
  url: string;
  cacheKey: string;
  size?: number;
  lastModified?: string;
  type?: string;
}

export interface CacheInfo {
  name: string;
  size: number;
  fileCount: number;
  files: CachedFile[];
}

// Initialize workbox caching
export const initializeCache = () => {
  log("Initializing cache management...");

  // Clean up outdated caches and precache assets
  cleanupOutdatedCaches();

  // Only precache if manifest is available (not in dev mode)
  if (self.__WB_MANIFEST && self.__WB_MANIFEST.length > 0) {
    precacheAndRoute(self.__WB_MANIFEST);
    log("Precaching enabled with", self.__WB_MANIFEST.length, "assets");
  } else {
    log("Precaching disabled (dev mode or no manifest)");
  }

  // Auto-update behavior: take control of all pages immediately
  self.skipWaiting();
  clientsClaim();

  log("Cache management initialized");
};

// Get all cached files from all caches
export const getAllCachedFiles = async (): Promise<CacheInfo[]> => {
  const cacheNames = await caches.keys();
  const cacheInfos: CacheInfo[] = [];

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    const files: CachedFile[] = [];
    let totalSize = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const url = request.url;
        const cacheKey = getCacheKeyForURL(url) || url;

        // Get file size from response
        const size = response.headers.get("content-length")
          ? parseInt(response.headers.get("content-length")!, 10)
          : undefined;

        // Get last modified date
        const lastModified = response.headers.get("last-modified") || undefined;

        // Get content type
        const type = response.headers.get("content-type") || undefined;

        if (size) totalSize += size;

        files.push({
          url,
          cacheKey,
          size,
          lastModified,
          type,
        });
      }
    }

    cacheInfos.push({
      name: cacheName,
      size: totalSize,
      fileCount: files.length,
      files: files.sort((a, b) => a.url.localeCompare(b.url)),
    });
  }

  return cacheInfos.sort((a, b) => a.name.localeCompare(b.name));
};

// Get cached files for a specific cache
export const getCachedFilesByCache = async (cacheName: string): Promise<CachedFile[]> => {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const files: CachedFile[] = [];

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const url = request.url;
      const cacheKey = getCacheKeyForURL(url) || url;

      // Get file size from response
      const size = response.headers.get("content-length")
        ? parseInt(response.headers.get("content-length")!, 10)
        : undefined;

      // Get last modified date
      const lastModified = response.headers.get("last-modified") || undefined;

      // Get content type
      const type = response.headers.get("content-type") || undefined;

      files.push({
        url,
        cacheKey,
        size,
        lastModified,
        type,
      });
    }
  }

  return files.sort((a, b) => a.url.localeCompare(b.url));
};

// Clear a specific cache
export const clearCache = async (cacheName: string): Promise<boolean> => {
  const success = await caches.delete(cacheName);
  log(`Cache ${cacheName} ${success ? "cleared" : "not found"}`);
  return success;
};

// Clear all caches
export const clearAllCaches = async (): Promise<{ success: boolean; clearedCaches: string[] }> => {
  const cacheNames = await caches.keys();
  const clearedCaches: string[] = [];

  for (const cacheName of cacheNames) {
    const success = await caches.delete(cacheName);
    if (success) {
      clearedCaches.push(cacheName);
    }
  }

  log(`Cleared ${clearedCaches.length} caches:`, clearedCaches);
  return { success: true, clearedCaches };
};

// Get cache statistics
export const getCacheStats = async (): Promise<{
  totalCaches: number;
  totalFiles: number;
  totalSize: number;
}> => {
  const cacheInfos = await getAllCachedFiles();
  const totalCaches = cacheInfos.length;
  const totalFiles = cacheInfos.reduce((sum, cache) => sum + cache.fileCount, 0);
  const totalSize = cacheInfos.reduce((sum, cache) => sum + cache.size, 0);

  return { totalCaches, totalFiles, totalSize };
};

// Register RPC handlers for cache management
export const registerCacheHandlers = () => {
  log("Registering cache RPC handlers...");

  // Get all cached files
  rpcServer.register("cache.getAll", getAllCachedFiles);

  // Get cached files for a specific cache
  rpcServer.register("cache.getByName", ({ cacheName }: { cacheName: string }) => {
    return getCachedFilesByCache(cacheName);
  });

  // Clear a specific cache
  rpcServer.register("cache.clear", ({ cacheName }: { cacheName: string }) => {
    return clearCache(cacheName);
  });

  // Clear all caches
  rpcServer.register("cache.clearAll", clearAllCaches);

  // Get cache statistics
  rpcServer.register("cache.getStats", getCacheStats);

  log("Cache RPC handlers registered");
};
