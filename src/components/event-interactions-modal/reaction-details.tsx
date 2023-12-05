import { Box, Button, Divider, Flex, SimpleGrid, SimpleGridProps, useDisclosure } from "@chakra-ui/react";
import { useMemo } from "react";

import { NostrEvent } from "../../types/nostr-event";
import { groupReactions } from "../../helpers/nostr/reactions";
import UserAvatarLink from "../user-avatar-link";
import UserLink from "../user-link";
import ReactionIcon from "../event-reactions/reaction-icon";

function ShowMoreGrid({
  pubkeys,
  cutoff,
  ...props
}: Omit<SimpleGridProps, "children"> & { pubkeys: string[]; cutoff: number }) {
  const showMore = useDisclosure();
  const limited = pubkeys.length > cutoff && !showMore.isOpen ? pubkeys.slice(0, cutoff) : pubkeys;

  return (
    <>
      <SimpleGrid spacing="1" {...props}>
        {limited.map((pubkey) => (
          <Flex gap="2" key={pubkey} alignItems="center" overflow="hidden">
            <UserAvatarLink pubkey={pubkey} size="xs" />
            <UserLink pubkey={pubkey} isTruncated />
          </Flex>
        ))}
      </SimpleGrid>
      {limited.length !== pubkeys.length && (
        <Button variant="link" size="md" onClick={showMore.onOpen}>
          Show {pubkeys.length - limited.length} more
        </Button>
      )}
    </>
  );
}

export default function ReactionDetails({ reactions }: { reactions: NostrEvent[] }) {
  const groups = useMemo(() => groupReactions(reactions), [reactions]);

  return (
    <Flex gap="2" direction="column">
      {groups.map((group) => (
        <Flex key={group.emoji} direction="column" gap="2">
          <Flex gap="2" alignItems="center">
            <Box fontSize="lg" borderWidth={1} w="8" h="8" borderRadius="md" p="1">
              <ReactionIcon emoji={group.emoji} url={group.url} />
            </Box>
            <Divider />
          </Flex>
          <ShowMoreGrid pubkeys={group.pubkeys} columns={{ base: 2, sm: 3, md: 4 }} cutoff={12} />
        </Flex>
      ))}
    </Flex>
  );
}
