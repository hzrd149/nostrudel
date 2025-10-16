import {
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Select,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useObservableEagerMemo, useObservableEagerState } from "applesauce-react/hooks";
import { map } from "rxjs";

import SimpleView from "../../../components/layout/presets/simple-view";
import Timestamp from "../../../components/timestamp";
import { UserAvatarLink } from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { updateSocialGraphCron } from "../../../services/cron";
import localSettings from "../../../services/preferences";
import { clearSocialGraph, socialGraph$ } from "../../../services/social-graph";

function FollowDistanceGroup({ distance, max, label }: { distance: number; max: number; label: string }) {
  const users = useObservableEagerMemo(
    () => socialGraph$.pipe(map((graph) => graph.getUsersByFollowDistance(distance))),
    [distance],
  );

  // Don't show empty groups
  if (users?.size === 0) return null;

  return (
    <Flex key={distance} direction="row" justify="space-between" align="center" minH="16" gap={4} wrap="wrap">
      <Box fontWeight="bold">
        <Text>{label}</Text>
        <Text color="gray.500" fontSize="lg">
          {humanReadableSats(users?.size ?? 0)}
        </Text>
      </Box>
      <AvatarGroup spacing={2}>
        {Array.from(users ?? [])
          .sort((a, b) => Math.random() - 0.5)
          .slice(0, max)
          .map((pubkey) => (
            <UserAvatarLink pubkey={pubkey} size="md" />
          ))}
      </AvatarGroup>
    </Flex>
  );
}

function SocialGraphCronSettings() {
  const running = useObservableEagerState(updateSocialGraphCron.running);
  const status = useObservableEagerState(updateSocialGraphCron.status);
  const interval = useObservableEagerState(updateSocialGraphCron.interval);
  const distance = useObservableEagerState(localSettings.updateSocialGraphDistance);
  const lastUpdated = useObservableEagerState(localSettings.lastUpdatedSocialGraph);

  return (
    <Card direction="row" p={4} rounded="md" flexWrap="wrap" gap={4}>
      <VStack align="start" spacing={2} flex={1} minW="xs">
        <HStack spacing={4} wrap="wrap">
          <Flex alignItems="center" gap={2}>
            <Text fontWeight="semibold" whiteSpace="nowrap">
              Update Interval:
            </Text>
            <Select
              value={interval / (1000 * 60 * 60)}
              onChange={(e) => {
                const hours = Number(e.target.value);
                localSettings.updateSocialGraphInterval.next(hours * 1000 * 60 * 60);
              }}
              w="auto"
              size="sm"
              rounded="md"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>1 day</option>
              <option value={48}>2 days</option>
              <option value={168}>1 week</option>
            </Select>
          </Flex>
          <Flex alignItems="center" gap={2}>
            <Text fontWeight="semibold" whiteSpace="nowrap">
              Distance:
            </Text>
            <Select
              value={distance}
              onChange={(e) => localSettings.updateSocialGraphDistance.next(Number(e.target.value))}
              w="auto"
              size="sm"
              rounded="md"
            >
              <option value={1}>1st degree</option>
              <option value={2}>2nd degree</option>
              <option value={3}>3rd degree</option>
            </Select>
          </Flex>
        </HStack>

        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
            Status:
          </Text>
          <Badge colorScheme={running ? "blue" : "gray"} variant="subtle">
            {running ? "Running" : "Idle"}
          </Badge>
          {status && (
            <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
              {status}
            </Text>
          )}
        </HStack>
      </VStack>

      <VStack alignItems="flex-end" spacing={2} ms="auto">
        {running ? (
          <Flex alignItems="center" gap={2}>
            <Spinner />
            <Button colorScheme="red" onClick={() => updateSocialGraphCron.cancel()}>
              Cancel
            </Button>
          </Flex>
        ) : (
          <Button
            colorScheme="primary"
            onClick={() => updateSocialGraphCron.run()}
            isLoading={running}
            isDisabled={running}
          >
            Run Now
          </Button>
        )}
        {lastUpdated > 0 && (
          <Text fontSize="sm" color="gray.500">
            Last updated: <Timestamp timestamp={lastUpdated / 1000} />
          </Text>
        )}
      </VStack>
    </Card>
  );
}

export default function SocialGraphSettings() {
  useAppTitle("Social Graph");
  const toast = useToast();
  const root = useObservableEagerMemo(() => socialGraph$.pipe(map((graph) => graph.getRoot())), []);
  const size = useObservableEagerMemo(() => socialGraph$.pipe(map((graph) => graph.size())), []);

  const updating = useObservableEagerState(updateSocialGraphCron.running);

  const displayMaxPeople = useBreakpointValue({ base: 4, lg: 5, xl: 10 }) || 4;

  const clearGraph = useAsyncAction(async () => {
    await clearSocialGraph();
    toast({
      title: "Social graph cleared",
      status: "success",
    });
  }, []);

  return (
    <SimpleView title="Social Graph" maxW="container.xl">
      {root && (
        <>
          <Card alignItems="center" rounded="md" p={4} direction="row" flexWrap="wrap" gap="2">
            <Flex align="center" gap={4}>
              <UserAvatarLink pubkey={root} size="lg" />
              <Box>
                <UserLink pubkey={root} fontSize="xl" fontWeight="bold" />
                <br />
                <UserDnsIdentity pubkey={root} fontSize="md" color="gray.500" />
              </Box>
            </Flex>
            <HStack spacing={2} ms="auto">
              <Text fontSize="sm" color="gray.500" display="flex" alignItems="center">
                {size ? `${humanReadableSats(size.users)} users` : "0 users"}
              </Text>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={clearGraph.run}
                isLoading={clearGraph.loading}
              >
                Reset Graph
              </Button>
            </HStack>
          </Card>
          <Card direction="column" gap={4} p={4} rounded="md">
            <Heading size="md" mt={4}>
              Your graph by follow distance
            </Heading>
            {!size || size.users <= 1 ? (
              <Flex p={4} align="center" justify="center" direction="column" gap={2}>
                <Text fontSize="lg">Your graph is empty.</Text>
                <Button colorScheme="primary" onClick={() => updateSocialGraphCron.run()} isLoading={updating}>
                  Update Graph
                </Button>
              </Flex>
            ) : (
              <>
                <FollowDistanceGroup distance={1} max={displayMaxPeople} label="Friends (1st degree)" />
                <FollowDistanceGroup distance={2} max={displayMaxPeople} label="Friends of Friends (2nd degree)" />
                <FollowDistanceGroup distance={3} max={displayMaxPeople} label="3rd degree" />
                <FollowDistanceGroup distance={4} max={displayMaxPeople} label="4th degree" />
                <FollowDistanceGroup distance={5} max={displayMaxPeople} label="5th degree" />
              </>
            )}
          </Card>
        </>
      )}

      {/* Cron Job Configuration Section */}
      <Heading size="md" mt="8">
        Automatic Social Graph Updates
      </Heading>
      <Text fontSize="sm" color="gray.500">
        Configure automatic updates to keep your social graph current with new follows and connections.
      </Text>
      <SocialGraphCronSettings />
    </SimpleView>
  );
}
