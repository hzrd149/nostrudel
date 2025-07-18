import { LockIcon } from "@chakra-ui/icons";
import { Box, Button, ButtonGroup, Flex, Progress, Text, useToast, VStack } from "@chakra-ui/react";
import { useActiveAccount, useObservableMemo } from "applesauce-react/hooks";
import { useMemo } from "react";
import { combineLatest, lastValueFrom } from "rxjs";

import { mergeRelaySets } from "applesauce-core/helpers";
import useAsyncAction from "../../../hooks/use-async-action";
import { PublishLogEntry } from "../../../providers/global/publish-provider";
import pool from "../../../services/pool";

export default function SendingStatus({ entries, onSkip }: { entries: PublishLogEntry[]; onSkip: () => void }) {
  const account = useActiveAccount();
  const toast = useToast();

  // Subscribe to all publishing results
  const allResults = useObservableMemo(
    () => (entries.length > 0 ? combineLatest(entries.map((entry) => entry.results$)) : undefined),
    [entries],
  );

  // Get unique relays from all entries
  const allRelays = useMemo(() => mergeRelaySets(...entries.map((e) => e.relays)), [entries]);

  // Track auth requirements for each relay
  const relayState =
    useObservableMemo(
      () =>
        allRelays.length > 0
          ? combineLatest(
              Object.fromEntries(
                allRelays.map((url) => [
                  url,
                  combineLatest({
                    required: pool.relay(url).authRequiredForPublish$,
                    authenticated: pool.relay(url).authenticated$,
                    connected: pool.relay(url).connected$,
                    challenge: pool.relay(url).challenge$,
                  }),
                ]),
              ),
            )
          : undefined,
      [allRelays],
    ) ?? {};

  // Calculate progress metrics across all entries
  const { totalRelays, successfulRelays, failedRelays, pendingRelays, allDone } = useMemo(() => {
    let total = 0;
    let successful: string[] = [];
    let failed: string[] = [];
    let done = true;

    entries.forEach((entry) => {
      total += entry.relays.length;
      if (allResults) {
        const entryIndex = entries.indexOf(entry);
        const results = allResults[entryIndex];
        if (results) {
          successful.push(...results.filter((p) => p.ok).map((p) => p.from));
          failed.push(...results.filter((p) => !p.ok).map((p) => p.from));
        }
      }
      if (!entry.done) done = false;
    });

    return {
      totalRelays: total,
      successfulRelays: successful,
      failedRelays: failed,
      pendingRelays: total - successful.length - failed.length,
      allDone: done,
    };
  }, [entries, allResults]);

  const progress = totalRelays > 0 ? (successfulRelays.length + failedRelays.length) / totalRelays : 0;

  // Find relays that require authentication
  const authRequiredRelays = useMemo(
    () =>
      allRelays.filter((url) => {
        const state = relayState[url];
        return state?.required && state?.authenticated === false && state?.connected && state?.challenge !== null;
      }),
    [allRelays, relayState],
  );

  // Authentication action
  const authenticateRelays = useAsyncAction(async () => {
    if (!account || !authRequiredRelays.length) return;

    // Authenticate all relays in parallel
    await Promise.all(
      authRequiredRelays.map((url) =>
        pool
          .relay(url)
          .authenticate(account)
          .catch((error) => {
            if (error instanceof Error) {
              toast({
                title: "Authentication failed",
                description: error.message,
                status: "error",
              });
            }
          }),
      ),
    );
  }, [authRequiredRelays, account]);

  // Status message
  const statusMessage = useMemo(() => {
    if (authRequiredRelays.length > 0) {
      return `${authRequiredRelays.length} relay${authRequiredRelays.length !== 1 ? "s" : ""} require authentication`;
    }
    if (allDone) {
      if (successfulRelays.length > 0) {
        const messageCount = entries.length > 1 ? `${entries.length} messages` : "message";
        return `Published ${messageCount} to ${successfulRelays} of ${totalRelays} relay${totalRelays !== 1 ? "s" : ""}`;
      }
      return "Publishing failed";
    }
    if (pendingRelays > 0) {
      const messageCount = entries.length > 1 ? `${entries.length} messages` : "message";
      return `Publishing ${messageCount} to ${pendingRelays} relay${pendingRelays !== 1 ? "s" : ""}...`;
    }
    return "Publishing...";
  }, [authRequiredRelays.length, pendingRelays, successfulRelays, totalRelays, allDone, entries.length]);

  return (
    <VStack spacing={3} align="stretch" w="full" p="2">
      {/* Progress bar at top */}
      <Progress
        value={progress * 100}
        colorScheme={successfulRelays.length > 0 ? "green" : "blue"}
        bg="gray.200"
        borderRadius="md"
      />

      {/* Status and actions at bottom */}
      <Flex align="center" wrap="wrap" gap="2">
        {/* Status message on the left */}
        <Box overflow="hidden" flex={1} minW="xs">
          <Text fontWeight="bold" isTruncated>
            {statusMessage}
          </Text>
          {failedRelays.length > 0 && (
            <Text fontSize="xs" color="red.500">
              {failedRelays.join(", ")} failed
            </Text>
          )}
        </Box>

        {/* Actions on the right */}
        <ButtonGroup ms="auto" size="sm">
          {authRequiredRelays.length > 0 && (
            <Button
              leftIcon={<LockIcon boxSize={3} />}
              onClick={authenticateRelays.run}
              isLoading={authenticateRelays.loading}
              colorScheme="green"
              loadingText="Authenticating..."
            >
              Authenticate
            </Button>
          )}
          <Button onClick={onSkip} colorScheme="primary">
            Skip
          </Button>
        </ButtonGroup>
      </Flex>
    </VStack>
  );
}
