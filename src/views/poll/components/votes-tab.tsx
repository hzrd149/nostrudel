import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { getPollOptions, getPollResponseVotes } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";

export default function PollVotesTab({ poll, responses }: { poll: NostrEvent; responses: NostrEvent[] }) {
  const options = useMemo(() => getPollOptions(poll), [poll]);

  // Group responses by the option they voted for (a response may appear under multiple options)
  const groups = useMemo(() => {
    const map = new Map<string, NostrEvent[]>();
    for (const option of options) map.set(option.id, []);

    for (const response of responses) {
      const votes = getPollResponseVotes(poll, response) ?? [];
      for (const id of votes) {
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(response);
      }
    }

    return options.map((option) => ({ option, votes: map.get(option.id) ?? [] }));
  }, [poll, options, responses]);

  if (responses.length === 0) {
    return (
      <Flex px="2" py="6" justifyContent="center">
        <Text color="gray.500">No votes yet.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4" px="2">
      {groups.map(({ option, votes }) => (
        <Box key={option.id}>
          <Flex gap="2" alignItems="baseline" mb="2">
            <Heading size="sm">{option.label}</Heading>
            <Text color="gray.500" fontSize="sm">
              {votes.length} {votes.length === 1 ? "vote" : "votes"}
            </Text>
          </Flex>
          {votes.length === 0 ? (
            <Text color="gray.500" fontSize="sm" pl="2">
              No votes
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing="2" pl="2">
              {votes.map((response) => (
                <Flex key={response.id} gap="2" alignItems="flex-start" minW={0}>
                  <UserAvatarLink pubkey={response.pubkey} size="sm" />
                  <Box minW={0} flex="1">
                    <Flex gap="2" alignItems="baseline" wrap="wrap">
                      <UserLink pubkey={response.pubkey} fontWeight="bold" isTruncated />
                      <Timestamp timestamp={response.created_at} color="gray.500" fontSize="sm" />
                    </Flex>
                    {response.content && (
                      <Text color="gray.500" fontSize="sm" whiteSpace="pre-wrap">
                        {response.content}
                      </Text>
                    )}
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>
          )}
        </Box>
      ))}
    </Flex>
  );
}
