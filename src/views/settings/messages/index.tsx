import {
  Badge,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Switch,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { useCallback, useState } from "react";
import { firstValueFrom } from "rxjs";

import ExpandableCard from "../../../components/expandable-card";
import SimpleView from "../../../components/layout/presets/simple-view";
import { decryptionCache$, decryptionCacheStats$ } from "../../../services/decryption-cache";
import localSettings from "../../../services/local-settings";

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

  return (
    <ExpandableCard
      title="Message Cache"
      badge={
        stats && (
          <HStack spacing={2}>
            <Badge colorScheme="blue">{stats.totalEntries} entries</Badge>
            {stats.isEncrypted && (
              <Badge colorScheme={stats.isLocked ? "red" : "green"}>{stats.isLocked ? "Locked" : "Unlocked"}</Badge>
            )}
          </HStack>
        )
      }
      isEmpty={stats?.totalEntries === 0}
      emptyMessage="No cached messages found"
      expandedActions={
        <ButtonGroup size="sm">
          <Button onClick={clearCache} isLoading={clearing} colorScheme="red" variant="outline">
            Clear Cache
          </Button>
        </ButtonGroup>
      }
    >
      {stats && (
        <VStack align="start" spacing={3}>
          <HStack justify="space-between" w="full">
            <Text>Total cached messages:</Text>
            <Text fontWeight="bold">{stats.totalEntries.toLocaleString()}</Text>
          </HStack>

          <HStack justify="space-between" w="full">
            <Text>Estimated cache size:</Text>
            <Text fontWeight="bold">{formatBytes(stats.estimatedSize)}</Text>
          </HStack>

          <HStack justify="space-between" w="full">
            <Text>Encryption status:</Text>
            <Text fontWeight="bold" color={stats.isEncrypted ? "green.500" : "orange.500"}>
              {stats.isEncrypted ? "Encrypted" : "Unencrypted"}
            </Text>
          </HStack>

          {stats.isEncrypted && (
            <HStack justify="space-between" w="full">
              <Text>Lock status:</Text>
              <Text fontWeight="bold" color={stats.isLocked ? "red.500" : "green.500"}>
                {stats.isLocked ? "Locked" : "Unlocked"}
              </Text>
            </HStack>
          )}
        </VStack>
      )}
    </ExpandableCard>
  );
}

export default function MessagesSettings() {
  const encryptDecryptionCache = useObservableEagerState(localSettings.encryptDecryptionCache);
  const autoDecryptMessages = useObservableEagerState(localSettings.autoDecryptMessages);
  const enableDecryptionCache = useObservableEagerState(localSettings.enableDecryptionCache);

  return (
    <SimpleView gap="4" title="Messages" maxW="4xl">
      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="autoDecryptMessages" mb="0">
            Automatically decrypt messages
          </FormLabel>
          <Switch
            id="autoDecryptMessages"
            isChecked={autoDecryptMessages}
            onChange={(e) => localSettings.autoDecryptMessages.next(e.target.checked)}
          />
        </Flex>
        <FormHelperText>Enabled: automatically decrypt direct messages when they are loaded</FormHelperText>
      </FormControl>

      <FormControl>
        <Flex alignItems="center">
          <FormLabel htmlFor="enableDecryptionCache" mb="0">
            Cached decrypted messages
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
    </SimpleView>
  );
}
