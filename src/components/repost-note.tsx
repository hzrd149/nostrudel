import { Box, Flex, Heading, SkeletonText } from "@chakra-ui/react";
import { useAsync } from "react-use";
import clientRelaysService from "../services/client-relays";
import singleEventService from "../services/single-event";
import { isETag, NostrEvent } from "../types/nostr-event";
import { ErrorFallback } from "./error-boundary";
import { Note } from "./note";
import { NoteMenu } from "./note/note-menu";
import { UserAvatar } from "./user-avatar";
import { UserDnsIdentityIcon } from "./user-dns-identity";
import { UserLink } from "./user-link";
import { getUserDisplayName } from "../helpers/user-metadata";

export default function RepostNote({ event, maxHeight }: { event: NostrEvent; maxHeight?: number }) {
  const {
    value: repostNote,
    loading,
    error,
  } = useAsync(async () => {
    const [_, eventId, relay] = event.tags.find(isETag) ?? [];
    if (eventId) {
      return singleEventService.requestEvent(eventId, relay ? [relay] : clientRelaysService.getReadUrls());
    }
    return null;
  }, [event]);

  return (
    <Flex gap="2" direction="column">
      <Flex gap="2" alignItems="center" pl="1">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <Heading size="sm" display="inline">
          <UserLink pubkey={event.pubkey} />
        </Heading>
        <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        <span>Shared note</span>
        <Box flex={1} />
        <NoteMenu event={event} size="sm" variant="link" aria-label="note options" />
      </Flex>
      {loading ? (
        <SkeletonText />
      ) : repostNote ? (
        <Note event={repostNote} maxHeight={maxHeight} />
      ) : (
        <ErrorFallback error={error} />
      )}
    </Flex>
  );
}
