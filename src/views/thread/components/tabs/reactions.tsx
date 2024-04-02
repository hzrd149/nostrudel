import { useMemo } from "react";
import { getEventUID } from "nostr-idb";
import { Box, Button, Divider, Flex, SimpleGrid, SimpleGridProps, useDisclosure } from "@chakra-ui/react";

import useEventReactions from "../../../../hooks/use-event-reactions";
import { ThreadItem } from "../../../../helpers/thread";
import { groupReactions } from "../../../../helpers/nostr/reactions";
import ReactionIcon from "../../../../components/event-reactions/reaction-icon";
import UserLink from "../../../../components/user/user-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";

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
          <Flex gap="2" key={pubkey} alignItems="center">
            <UserAvatarLink pubkey={pubkey} size="sm" />
            <UserLink pubkey={pubkey} isTruncated fontWeight="bold" />
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

export default function PostReactionsTab({ post }: { post: ThreadItem }) {
  const reactions = useEventReactions(getEventUID(post.event)) ?? [];
  const groups = useMemo(() => groupReactions(reactions), [reactions]);

  return (
    <Flex gap="2" direction="column" px="2">
      {groups.map((group) => (
        <Flex key={group.emoji} direction="column" gap="2">
          <Flex gap="2" alignItems="center">
            <Box fontSize="xl" borderWidth={1} w="10" h="10" borderRadius="md" p="2" flexShrink={0}>
              <ReactionIcon emoji={group.emoji} url={group.url} />
            </Box>
            {group.url ? group.emoji : ""}
            <Divider />
          </Flex>
          <ShowMoreGrid pubkeys={group.pubkeys} columns={{ base: 1, sm: 2, md: 4, lg: 5, xl: 6 }} cutoff={12} />
        </Flex>
      ))}
    </Flex>
  );
}
