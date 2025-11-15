import { Box, Card, CardBody, Flex, SimpleGrid, Stat, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { of, switchMap } from "rxjs";

import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import { relatr$ } from "../../../../services/lookup/relatr";

const stats$ = relatr$.pipe(switchMap((relatr) => (relatr ? relatr.Stats({}) : of(null))));

export function RelatrServerStatus() {
  const stats = useObservableState(stats$);

  if (!stats) return null;

  const source = stats.sourcePubkey;

  return (
    <Card variant="outline">
      <CardBody>
        <Flex gap="3" align="center" mb="3">
          <UserAvatarLink pubkey={source} size="md" />
          <Box flex="1" overflow="hidden">
            <UserLink pubkey={source} fontWeight="semibold" />
            <Text fontSize="xs" color="gray.500" fontFamily="mono" isTruncated>
              {nip19.npubEncode(source)}
            </Text>
          </Box>
        </Flex>

        {stats && (
          <Box borderTopWidth="1px" pt="3">
            <SimpleGrid columns={2} spacing={3}>
              <Stat>
                <StatLabel fontSize="xs">Users</StatLabel>
                <StatNumber fontSize="md">{stats.socialGraph.stats.users.toLocaleString()}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Follows</StatLabel>
                <StatNumber fontSize="md">{stats.socialGraph.stats.follows.toLocaleString()}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Database Entries</StatLabel>
                <StatNumber fontSize="md">{stats.database.metrics.totalEntries.toLocaleString()}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel fontSize="xs">Metadata</StatLabel>
                <StatNumber fontSize="md">{stats.database.metadata.totalEntries.toLocaleString()}</StatNumber>
              </Stat>
            </SimpleGrid>
          </Box>
        )}
      </CardBody>
    </Card>
  );
}
