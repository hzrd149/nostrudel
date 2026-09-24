import {
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Flex,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import ExpandableCard from "../../../components/expandable-card";
import useAsyncAction from "../../../hooks/use-async-action";
import {
  getAllCachedFiles,
  clearCache,
  clearAllCaches,
  refreshOfflineCache,
  formatFileSize,
  formatCacheName,
} from "../../../sw/client/cache";
import type { CacheInfo } from "../../../sw/worker/cache";

export default function CachedFilesCard() {
  const [cacheInfos, setCacheInfos] = useState<CacheInfo[]>([]);
  const [isLoadingCaches, setIsLoadingCaches] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState<string | null>(null);
  const [expandedCaches, setExpandedCaches] = useState<Set<string>>(new Set());
  const toast = useToast();

  // Load cached files
  const loadCachedFiles = useCallback(async () => {
    setIsLoadingCaches(true);
    try {
      const caches = await getAllCachedFiles();
      setCacheInfos(caches);
    } catch (error) {
      console.error("Failed to load cached files:", error);
      setCacheInfos([]);
      toast({
        title: "Failed to load cached files",
        description: "Could not retrieve cached files from service worker",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoadingCaches(false);
    }
  }, [toast]);

  // Clear a specific cache
  const { run: handleClearCache } = useAsyncAction(
    async (cacheName: string) => {
      // Track which row's spinner should show; the hook's own `loading` is a
      // single boolean and cannot distinguish which cache is being cleared.
      setIsClearingCache(cacheName);
      try {
        await clearCache(cacheName);
        // Remove the cleared cache from the list
        setCacheInfos((prev) => prev.filter((cache) => cache.name !== cacheName));
        toast({
          title: "Cache cleared",
          description: `Cache "${formatCacheName(cacheName)}" has been cleared successfully`,
          status: "success",
          duration: 3000,
        });
      } finally {
        setIsClearingCache(null);
      }
    },
    [toast],
  );

  // Clear all caches
  const { run: handleClearAllCaches, loading: isClearingAllCaches } = useAsyncAction(async () => {
    const clearedCaches = await clearAllCaches();
    setCacheInfos([]);
    toast({
      title: "All caches cleared",
      description: `Cleared ${clearedCaches.length} caches successfully`,
      status: "success",
      duration: 3000,
    });
  }, [toast]);

  // Refresh offline cache
  const { run: handleRefreshCache, loading: isRefreshingCache } = useAsyncAction(async () => {
    const cachedFiles = await refreshOfflineCache();
    // Reload the cached files list to show updated cache
    await loadCachedFiles();
    toast({
      title: "Offline cache updated",
      description: `Successfully cached ${cachedFiles} files for offline use`,
      status: "success",
      duration: 3000,
    });
  }, [loadCachedFiles, toast]);

  // Toggle cache expansion
  const toggleCacheExpansion = (cacheName: string) => {
    setExpandedCaches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cacheName)) {
        newSet.delete(cacheName);
      } else {
        newSet.add(cacheName);
      }
      return newSet;
    });
  };

  const totalFiles = cacheInfos.reduce((sum, cache) => sum + cache.fileCount, 0);
  const totalSize = cacheInfos.reduce((sum, cache) => sum + cache.size, 0);

  const truncateUrl = (url: string, maxLength: number = 120) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength / 2);
    const end = url.substring(url.length - maxLength / 2);
    return `${start}...${end}`;
  };

  const badge =
    totalFiles > 0 ? (
      <Badge colorScheme="blue" borderRadius="full">
        {totalFiles} files ({formatFileSize(totalSize)})
      </Badge>
    ) : null;

  const expandedActions = (
    <HStack spacing={2}>
      <Button
        size="sm"
        colorScheme="blue"
        variant="outline"
        onClick={handleRefreshCache}
        isLoading={isRefreshingCache}
        loadingText="Updating..."
      >
        Update offline cache
      </Button>
      {cacheInfos.length > 0 && (
        <Button
          size="sm"
          colorScheme="red"
          variant="outline"
          onClick={handleClearAllCaches}
          isLoading={isClearingAllCaches}
          loadingText="Clearing..."
        >
          Clear All
        </Button>
      )}
    </HStack>
  );

  return (
    <ExpandableCard
      title="Cached Files"
      badge={badge}
      isLoading={isLoadingCaches}
      isEmpty={cacheInfos.length === 0}
      emptyMessage="No cached files found"
      expandedActions={expandedActions}
      onExpand={loadCachedFiles}
    >
      <VStack align="stretch" spacing={3}>
        {cacheInfos.map((cacheInfo) => (
          <Card key={cacheInfo.name} size="sm" variant="outline">
            <Flex p={3} justify="space-between" align="center">
              <HStack>
                <IconButton
                  aria-label={expandedCaches.has(cacheInfo.name) ? "Collapse cache" : "Expand cache"}
                  icon={expandedCaches.has(cacheInfo.name) ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => toggleCacheExpansion(cacheInfo.name)}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold" fontSize="sm">
                    {formatCacheName(cacheInfo.name)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {cacheInfo.fileCount} files • {formatFileSize(cacheInfo.size)}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleClearCache(cacheInfo.name)}
                isLoading={isClearingCache === cacheInfo.name}
                loadingText="Clearing..."
              >
                Clear
              </Button>
            </Flex>

            <Collapse in={expandedCaches.has(cacheInfo.name)}>
              <Box px={3} pb={3}>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>URL</Th>
                        <Th>Size</Th>
                        <Th>Type</Th>
                        <Th>Modified</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {cacheInfo.files.map((file, index) => (
                        <Tr key={`${file.url}-${index}`}>
                          <Td>
                            <Text fontSize="xs" title={file.url}>
                              {truncateUrl(file.url)}
                            </Text>
                          </Td>
                          <Td fontSize="xs">{formatFileSize(file.size)}</Td>
                          <Td fontSize="xs" color="gray.500">
                            {file.type?.split("/")[1] || "unknown"}
                          </Td>
                          <Td fontSize="xs" color="gray.500">
                            {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : "Unknown"}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
          </Card>
        ))}
      </VStack>
    </ExpandableCard>
  );
}
