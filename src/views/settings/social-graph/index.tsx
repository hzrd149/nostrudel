import {
  AvatarGroup,
  Box,
  Button,
  ButtonGroup,
  Card,
  Flex,
  Heading,
  NumberInput,
  NumberInputField,
  Text,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { useCallback, useEffect, useState } from "react";

import SimpleView from "../../../components/layout/presets/simple-view";
import UserAvatar from "../../../components/user/user-avatar";
import { UserAvatarLink } from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserName from "../../../components/user/user-name";
import { useAppTitle } from "../../../hooks/use-app-title";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import pool from "../../../services/pool";
import {
  createBatchUserLoader,
  exportGraph,
  graphLoader,
  importGraph,
  socialGraph,
} from "../../../services/social-graph";
import { useUnmount } from "react-use";
import { Subscription } from "rxjs";

export default function SocialGraphSettings() {
  useAppTitle("Social Graph");
  const [followDistances, setFollowDistances] = useState<{ distance: number; count: number; randomUsers: string[] }[]>(
    [],
  );
  const account = useActiveAccount();
  const [distance, setDistance] = useState(2);

  // Generate follow distances with random users for distances 1-5
  const generateFollowDistances = useCallback(() => {
    if (!socialGraph) return [];
    return [1, 2, 3, 4, 5]
      .map((distance) => {
        const users = Array.from(socialGraph.getUsersByFollowDistance(distance) ?? []);
        const randomUsers = users.sort(() => 0.5 - Math.random());
        return {
          distance,
          count: users.length,
          randomUsers,
        };
      })
      .filter((d) => d.count > 0);
  }, [socialGraph]);

  useEffect(() => {
    setFollowDistances(generateFollowDistances());
  }, [socialGraph, generateFollowDistances]);

  const [loading, setLoading] = useState<Subscription>();
  const handleLoadGraph = () => {
    if (account?.pubkey && socialGraph) {
      setLoading(
        graphLoader(account.pubkey, distance, createBatchUserLoader(pool.request.bind(pool))).subscribe({
          next: (progress) => {
            console.log(progress);
          },
        }),
      );
    }
  };
  useUnmount(() => {
    loading?.unsubscribe();
  });

  const displayMaxPeople = useBreakpointValue({ base: 4, lg: 5, xl: 10 }) || 4;

  return (
    <SimpleView title="Social Graph" maxW="container.xl" center>
      {account && (
        <Card alignItems="center" rounded="md" p={4} direction="row" flexWrap="wrap">
          <Flex align="center" gap={4}>
            <UserAvatar pubkey={account?.pubkey} size="lg" />
            <Box>
              <UserName pubkey={account?.pubkey} fontSize="xl" fontWeight="bold" />
              <br />
              <UserDnsIdentity pubkey={account?.pubkey} fontSize="md" color="gray.500" />
            </Box>
          </Flex>
          <Flex align="center" gap={2} ms="auto">
            <NumberInput
              value={distance}
              min={1}
              max={10}
              onChange={(_, v) => setDistance(Number(v) || 1)}
              width="80px"
              mr={2}
            >
              <NumberInputField />
            </NumberInput>
            <Button colorScheme="primary" onClick={handleLoadGraph} isDisabled={!account?.pubkey} isLoading={loading}>
              Load Graph
            </Button>
          </Flex>
        </Card>
      )}
      <Card direction="column" gap={4} p={4} rounded="md">
        <Heading size="md" mt={4}>
          Your graph by follow distance
        </Heading>
        {followDistances.length === 0 && (
          <Flex p={4} align="center" justify="center">
            None
          </Flex>
        )}
        {followDistances.map((d) => (
          <Flex key={d.distance} direction="row" justify="space-between" align="center">
            <Flex direction="column" align="center" justify="center" w={12} fontSize="xl">
              <b>{d.distance}</b>
              <Text color="gray.500" fontSize="md">
                {d.count}
              </Text>
            </Flex>
            <AvatarGroup spacing={2}>
              {d.randomUsers.slice(0, displayMaxPeople).map((pubkey) => (
                <UserAvatarLink pubkey={pubkey} size="md" />
              ))}
            </AvatarGroup>
          </Flex>
        ))}
      </Card>
      <ButtonGroup>
        <Button onClick={() => exportGraph()} isDisabled={!socialGraph}>
          Export
        </Button>
        <Button colorScheme="primary" onClick={() => importGraph()} isDisabled={!socialGraph}>
          Import
        </Button>
      </ButtonGroup>
    </SimpleView>
  );
}
