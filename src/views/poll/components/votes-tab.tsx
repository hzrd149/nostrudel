import { Box, Flex, Text } from "@chakra-ui/react";
import { getPollOptions, getPollResponseVotes } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";

export default function PollVotesTab({ poll, responses }: { poll: NostrEvent; responses: NostrEvent[] }) {
  const options = useMemo(() => getPollOptions(poll), [poll]);
  const optionLabels = useMemo(() => new Map(options.map((option) => [option.id, option.label])), [options]);

  if (responses.length === 0) {
    return (
      <Flex px="2" py="6" justifyContent="center">
        <Text color="gray.500">No votes yet.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3" px="2">
      {responses.map((response) => {
        const votes = getPollResponseVotes(poll, response) ?? [];
        const labels = votes.map((id) => optionLabels.get(id) ?? id);

        return (
          <Flex key={response.id} gap="2" alignItems="flex-start">
            <UserAvatarLink pubkey={response.pubkey} size="sm" />
            <Box minW={0} flex="1">
              <Flex gap="2" alignItems="baseline" wrap="wrap">
                <UserLink pubkey={response.pubkey} fontWeight="bold" />
                <Timestamp timestamp={response.created_at} color="gray.500" fontSize="sm" />
              </Flex>
              <Text>{labels.join(", ") || "Unknown option"}</Text>
              {response.content && (
                <Text color="gray.500" fontSize="sm" whiteSpace="pre-wrap">
                  {response.content}
                </Text>
              )}
            </Box>
          </Flex>
        );
      })}
    </Flex>
  );
}
