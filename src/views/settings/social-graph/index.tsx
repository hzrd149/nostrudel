import { AvatarGroup, Box, Button, ButtonGroup, Card, Flex, Heading, Select, Text } from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { useMemo, useState } from "react";
import { useUnmount } from "react-use";
import { Subscription } from "rxjs";

import SimpleView from "../../../components/layout/presets/simple-view";
import { UserAvatarLink } from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { humanReadableSats } from "../../../helpers/lightning";
import { useAppTitle } from "../../../hooks/use-app-title";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { socialGraphLoader } from "../../../services/loaders";
import { exportGraph, importGraph, socialGraph$ } from "../../../services/social-graph";

function FollowDistanceGroup({ distance, max, label }: { distance: number; max: number; label: string }) {
  const graph = useObservableEagerState(socialGraph$);
  const users = useMemo(() => graph.getUsersByFollowDistance(distance), [graph, distance]);

  return (
    <Flex key={distance} direction="row" justify="space-between" align="center" minH="16" gap={4}>
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

export default function SocialGraphSettings() {
  useAppTitle("Social Graph");
  const socialGraph = useObservableState(socialGraph$);
  const root = useMemo(() => socialGraph?.getRoot(), [socialGraph]);
  const size = useMemo(() => socialGraph?.size(), [socialGraph]);

  const [loading, setLoading] = useState<Subscription>();
  const [distance, setDistance] = useState(2);

  const handleLoadGraph = () => {
    if (!root) return;

    setLoading(
      socialGraphLoader({ pubkey: root, distance }).subscribe({
        complete: () => setLoading(undefined),
      }),
    );
  };
  useUnmount(() => {
    loading?.unsubscribe();
  });

  const displayMaxPeople = useBreakpointValue({ base: 4, lg: 5, xl: 10 }) || 4;

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
            <Flex align="center" gap={2} flex={1} justifyContent="flex-end">
              <Select value={distance} onChange={(e) => setDistance(Number(e.target.value))} w="auto">
                <option value={1}>1st degree (friends)</option>
                <option value={2}>2nd degree (friends of friends)</option>
                <option value={3}>3rd degree</option>
              </Select>
              <Button colorScheme="primary" onClick={handleLoadGraph} isLoading={!!loading}>
                Load Graph
              </Button>
            </Flex>
          </Card>
          <Card direction="column" gap={4} p={4} rounded="md">
            <Heading size="md" mt={4}>
              Your graph by follow distance
            </Heading>
            {!size || size.users + size.mutes === 0 ? (
              <Flex p={4} align="center" justify="center">
                None
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
          <ButtonGroup>
            <Button onClick={() => exportGraph()} isDisabled={!socialGraph}>
              Export
            </Button>
            <Button colorScheme="primary" onClick={() => importGraph()} isDisabled={!socialGraph}>
              Import
            </Button>
          </ButtonGroup>
        </>
      )}
    </SimpleView>
  );
}
