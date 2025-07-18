import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  SimpleGrid,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { useCallback, useState } from "react";
import { firstValueFrom } from "rxjs";

import { decryptionCache$, decryptionCacheStats$ } from "../../../services/decryption-cache";
import localSettings from "../../../services/preferences";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function DecryptionCacheStats() {
  const stats = useObservableState(decryptionCacheStats$);
  const [clearing, setClearing] = useState(false);
  const toast = useToast();

  const clearCache = useCallback(async () => {
    if (!confirm("Are you sure you want to clear the message cache? This will remove all cached decrypted messages.")) {
      return;
    }

    const cache = await firstValueFrom(decryptionCache$);
    if (!cache) return;

    setClearing(true);
    try {
      await cache.clear();
      toast({
        title: "Message cache cleared",
        status: "success",
      });
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast({
        title: "Failed to clear cache",
        status: "error",
      });
    } finally {
      setClearing(false);
    }
  }, [toast]);

  if (!stats) return null;

  return (
    <VStack spacing="3" align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="md">Cache Statistics</Heading>
        <HStack spacing={2}>
          <Badge colorScheme="blue">{stats.totalEntries} entries</Badge>
          {stats.isEncrypted && (
            <Badge colorScheme={stats.isLocked ? "red" : "green"}>{stats.isLocked ? "Locked" : "Unlocked"}</Badge>
          )}
        </HStack>
      </Flex>

      {stats.totalEntries > 0 ? (
        <SimpleGrid spacing={1} columns={2}>
          <Text>Total cached messages:</Text>
          <Text fontWeight="bold" textAlign="right">
            {stats.totalEntries.toLocaleString()}
          </Text>

          <Text>Estimated cache size:</Text>
          <Text fontWeight="bold" textAlign="right">
            {formatBytes(stats.estimatedSize)}
          </Text>

          <Text>Encryption status:</Text>
          <Text fontWeight="bold" color={stats.isEncrypted ? "green.500" : "orange.500"} textAlign="right">
            {stats.isEncrypted ? "Encrypted" : "Unencrypted"}
          </Text>

          {stats.isEncrypted && (
            <>
              <Text>Lock status:</Text>
              <Text fontWeight="bold" color={stats.isLocked ? "red.500" : "green.500"} textAlign="right">
                {stats.isLocked ? "Locked" : "Unlocked"}
              </Text>
            </>
          )}

          <Button onClick={clearCache} isLoading={clearing} colorScheme="red" variant="outline" size="sm" me="auto">
            Clear Cache
          </Button>
        </SimpleGrid>
      ) : (
        <Text color="gray.500" fontSize="sm" fontStyle="italic">
          No cached messages found
        </Text>
      )}
    </VStack>
  );
}

export default function MessageCacheSection() {
  const encryptDecryptionCache = useObservableEagerState(localSettings.encryptDecryptionCache);
  const enableDecryptionCache = useObservableEagerState(localSettings.enableDecryptionCache);

  return (
    <VStack spacing="4" align="stretch">
      <VStack spacing="1" align="start">
        <Heading size="md">Message Cache</Heading>
        <Text fontSize="sm" color="gray.500">
          Configure how decrypted messages are cached locally to improve performance.
        </Text>
      </VStack>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="enableDecryptionCache" mb="0">
            Cache decrypted messages
          </FormLabel>
          <Switch
            id="enableDecryptionCache"
            isChecked={enableDecryptionCache}
            onChange={(e) => localSettings.enableDecryptionCache.next(e.target.checked)}
          />
        </Flex>
        <FormHelperText>Store decrypted messages locally in your browser to speed up message loading.</FormHelperText>
      </FormControl>

      {enableDecryptionCache && (
        <>
          <FormControl>
            <Flex alignItems="center">
              <FormLabel htmlFor="encryptDecryptionCache" mb="0">
                Encrypt cached messages
              </FormLabel>
              <Switch
                id="encryptDecryptionCache"
                isChecked={encryptDecryptionCache}
                onChange={(e) => localSettings.encryptDecryptionCache.next(e.target.checked)}
              />
            </Flex>
            <FormHelperText>
              Whether to encrypt cached decrypted messages with a password when they are stored locally
            </FormHelperText>
          </FormControl>

          <DecryptionCacheStats />
        </>
      )}
    </VStack>
  );
}
