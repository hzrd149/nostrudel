import {
  AvatarGroup,
  Box,
  Button,
  ButtonGroup,
  Card,
  Flex,
  Heading,
  Input,
  Link,
  Select,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useObservableEagerState, useObservableState } from "applesauce-react/hooks";
import { useMemo, useState } from "react";
import { useUnmount } from "react-use";
import { Subscription } from "rxjs";

import SimpleView from "../../../components/layout/presets/simple-view";
import { UserAvatarLink } from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import { SOCIAL_GRAPH_DOWNLOAD_URL } from "../../../const";
import { humanReadableSats } from "../../../helpers/lightning";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { socialGraphLoader } from "../../../services/loaders";
import { exportGraph, importGraph, loadSocialGraphFromUrl, socialGraph$ } from "../../../services/social-graph";

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
  const toast = useToast();
  const socialGraph = useObservableState(socialGraph$);
  const root = useMemo(() => socialGraph?.getRoot(), [socialGraph]);
  const size = useMemo(() => socialGraph?.size(), [socialGraph]);

  const [downloadUrl, setDownloadUrl] = useState(SOCIAL_GRAPH_DOWNLOAD_URL);

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

  const downloadGraph = useAsyncAction(
    async (e: React.FormEvent) => {
      e.preventDefault();

      await loadSocialGraphFromUrl(downloadUrl);
      toast({
        title: "Downloaded social graph",
        status: "success",
      });
    },
    [downloadUrl],
  );

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
                Update Graph
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
          <Flex gap="2" justifyContent="space-between" flexWrap="wrap">
            <Flex as="form" gap="2" onSubmit={downloadGraph.run} direction="column">
              <Flex gap="2">
                <Input
                  name="url"
                  type="url"
                  placeholder={SOCIAL_GRAPH_DOWNLOAD_URL}
                  value={downloadUrl}
                  maxW="lg"
                  w="full"
                  onChange={(e) => setDownloadUrl(e.target.value)}
                />
                <Button type="submit" flexShrink={0} isLoading={downloadGraph.loading}>
                  Download
                </Button>
              </Flex>
              <Text fontSize="sm" color="gray.500">
                A URL to download serialized social graph that is compatible with the{" "}
                <Link href="https://github.com/mmalmi/nostr-social-graph" isExternal color="blue.500">
                  nostr-social-graph
                </Link>{" "}
                library.
              </Text>
            </Flex>
            <ButtonGroup>
              <Button onClick={() => exportGraph()} isDisabled={!socialGraph}>
                Export
              </Button>
              <Button colorScheme="primary" onClick={() => importGraph()} isDisabled={!socialGraph}>
                Import
              </Button>
            </ButtonGroup>
          </Flex>
        </>
      )}
    </SimpleView>
  );
}
