import {
  AvatarGroup,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Select,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { useMemo, useState } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import Timestamp from "../../../components/timestamp";
import { UserAvatarLink } from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import { useUserOutbox } from "../../../hooks/use-user-mailboxes";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { updateSocialGraphCron } from "../../../services/cron";
import localSettings from "../../../services/preferences";
import {
  clearSocialGraph,
  persistGraph,
  saveState$,
  socialGraph$,
  startSocialGraphSync,
  stopSocialGraphSync,
  sync$,
  syncState$,
} from "../../../services/social-graph";

const SINCE_OPTIONS: { label: string; value: number | null }[] = [
  { label: "All time", value: null },
  { label: "Last 24 hours", value: 60 * 60 * 24 },
  { label: "Last 7 days", value: 60 * 60 * 24 * 7 },
  { label: "Last 30 days", value: 60 * 60 * 24 * 30 },
  { label: "Last 3 months", value: 60 * 60 * 24 * 90 },
  { label: "Last 6 months", value: 60 * 60 * 24 * 180 },
  { label: "Last year", value: 60 * 60 * 24 * 365 },
];

function DistanceRow({ distance, max }: { distance: number; max: number }) {
  const graph = use$(socialGraph$);

  const pubkeys = useMemo(() => (graph ? Array.from(graph.getUsersByFollowDistance(distance)) : []), [graph, distance]);

  const total = pubkeys.length;

  if (total === 0 && distance > 0) return null;

  const preview = pubkeys.slice(0, max);

  return (
    <Tr>
      <Td verticalAlign="top" fontWeight="bold" fontSize="lg" w="16">
        {distance}
      </Td>
      <Td verticalAlign="top" w="24">
        {humanReadableSats(total)}
      </Td>
      <Td>
        {preview.length > 0 ? (
          <AvatarGroup spacing={2} max={max}>
            {preview.map((pubkey) => (
              <UserAvatarLink key={pubkey} pubkey={pubkey} size="md" />
            ))}
          </AvatarGroup>
        ) : (
          <Text>No users</Text>
        )}
      </Td>
    </Tr>
  );
}

export default function SocialGraphSettings() {
  useAppTitle("Social Graph");
  const toast = useToast();

  const graph = use$(socialGraph$);
  const sync = use$(sync$);
  const syncState = use$(syncState$);
  const saveState = use$(saveState$);
  const isRunning = !!sync;

  const root = graph?.getRoot();
  const size = graph?.size();
  const outboxes = useUserOutbox(root);

  const interval = use$(updateSocialGraphCron.interval);
  const distance = use$(localSettings.updateSocialGraphDistance);
  const lastUpdated = use$(localSettings.lastUpdatedSocialGraph);

  // Local UI-only state for manual syncs; not persisted.
  const [sinceSeconds, setSinceSeconds] = useState<number | null>(null);

  const displayMaxPeople = useBreakpointValue({ base: 6, lg: 12, xl: 16 }) || 6;

  const handleStart = () => {
    const since = sinceSeconds != null ? Math.floor(Date.now() / 1000) - sinceSeconds : undefined;
    startSocialGraphSync({
      distance,
      since,
      relays: outboxes,
    });
  };

  const handleSave = useAsyncAction(async () => {
    await persistGraph();
  }, []);

  const clearGraph = useAsyncAction(async () => {
    await clearSocialGraph();
    toast({ title: "Social graph cleared", status: "success" });
  }, []);

  return (
    <SimpleView title="Social Graph" maxW="container.xl">
      {root && (
        <Flex alignItems="center" direction="row" flexWrap="wrap" gap="2">
          <Flex align="center" gap={4}>
            <UserAvatarLink pubkey={root} size="lg" />
            <Box>
              <UserLink pubkey={root} fontSize="xl" fontWeight="bold" />
              <br />
              <UserDnsIdentity pubkey={root} fontSize="md" />
            </Box>
          </Flex>
          <HStack spacing={2} ms="auto">
            <Text fontSize="sm">{size ? `${humanReadableSats(size.users)} users` : "0 users"}</Text>
          </HStack>
        </Flex>
      )}

      <Flex direction="column" gap={4}>
        <Heading size="md">Update social graph</Heading>
        <Flex wrap="wrap" gap={4} align="end">
          <Box>
            <Text fontWeight="semibold" mb={1} fontSize="sm">
              Sync depth
            </Text>
            <Select
              value={distance}
              onChange={(e) => localSettings.updateSocialGraphDistance.next(Number(e.target.value))}
              size="sm"
              w="auto"
              isDisabled={isRunning}
            >
              <option value={1}>1 (friends)</option>
              <option value={2}>2 (friends of friends)</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </Select>
          </Box>

          <Box>
            <Text fontWeight="semibold" mb={1} fontSize="sm">
              Since
            </Text>
            <Select
              value={sinceSeconds ?? ""}
              onChange={(e) => setSinceSeconds(e.target.value === "" ? null : Number(e.target.value))}
              size="sm"
              w="auto"
              isDisabled={isRunning}
            >
              {SINCE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? ""}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Box>

          <Box>
            <Text fontWeight="semibold" mb={1} fontSize="sm">
              Auto update
            </Text>
            <Select
              value={interval / (1000 * 60 * 60)}
              onChange={(e) => {
                const hours = Number(e.target.value);
                localSettings.updateSocialGraphInterval.next(hours * 1000 * 60 * 60);
              }}
              size="sm"
              w="auto"
            >
              <option value={1}>Every 1 hour</option>
              <option value={6}>Every 6 hours</option>
              <option value={12}>Every 12 hours</option>
              <option value={24}>Every 1 day</option>
              <option value={48}>Every 2 days</option>
              <option value={168}>Every 1 week</option>
            </Select>
          </Box>
        </Flex>

        <ButtonGroup size="sm" isAttached variant="outline" alignSelf="start">
          {isRunning ? (
            <Button colorScheme="red" onClick={stopSocialGraphSync}>
              Stop
            </Button>
          ) : (
            <Button colorScheme="primary" variant="solid" onClick={handleStart} isDisabled={!root}>
              Start
            </Button>
          )}
          <Button
            colorScheme={saveState === "saved" ? "green" : undefined}
            onClick={handleSave.run}
            isLoading={handleSave.loading || saveState === "saving"}
            isDisabled={!size || size.users === 0 || saveState !== "idle"}
          >
            {saveState === "saved" ? "Saved" : "Save"}
          </Button>
          <Button colorScheme="red" variant="ghost" onClick={clearGraph.run} isLoading={clearGraph.loading}>
            Clear
          </Button>
        </ButtonGroup>

        <Flex align="center" gap={3} flexWrap="wrap">
          <Badge colorScheme={isRunning ? "green" : "gray"} variant={isRunning ? "solid" : "subtle"}>
            {isRunning ? "Running" : "Idle"}
          </Badge>
          {isRunning && <Spinner size="xs" />}
          <Text fontSize="sm">
            Loaded{" "}
            <Text as="span" fontWeight="bold">
              {syncState?.loaded ?? 0}
            </Text>{" "}
            follow events
          </Text>
          {size && (
            <Text fontSize="sm" ms="auto">
              Graph size:{" "}
              <Text as="span" fontFamily="mono">
                {humanReadableSats(size.users)}
              </Text>{" "}
              users
            </Text>
          )}
          {lastUpdated > 0 && (
            <Text fontSize="sm">
              Last updated: <Timestamp timestamp={lastUpdated / 1000} />
            </Text>
          )}
        </Flex>
      </Flex>

      <Heading size="md">Your graph by follow distance</Heading>
      {!size || size.users <= 1 ? (
        <Flex p={4} align="center" justify="center" direction="column" gap={2}>
          <Text fontSize="lg">Your graph is empty.</Text>
          <Button colorScheme="primary" onClick={handleStart} isDisabled={!root || isRunning}>
            Start sync
          </Button>
        </Flex>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Distance</Th>
                <Th>Count</Th>
                <Th>Users (preview)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <DistanceRow key={d} distance={d} max={displayMaxPeople} />
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <Text fontSize="sm">
        Crawl and persist a social graph rooted at your account. The graph is saved to local storage so it can be
        reloaded later, and is updated automatically as new follow lists arrive.
      </Text>
    </SimpleView>
  );
}
