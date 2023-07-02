import { useRef } from "react";
import { Flex, Heading, SkeletonText, Text } from "@chakra-ui/react";
import { useAsync } from "react-use";
import singleEventService from "../services/single-event";
import { isETag, NostrEvent } from "../types/nostr-event";
import { ErrorFallback } from "./error-boundary";
import { Note } from "./note";
import { NoteMenu } from "./note/note-menu";
import { UserAvatar } from "./user-avatar";
import { UserDnsIdentityIcon } from "./user-dns-identity-icon";
import { UserLink } from "./user-link";
import { TrustProvider } from "../providers/trust";
import { safeJson } from "../helpers/parse";
import { verifySignature } from "nostr-tools";
import { useReadRelayUrls } from "../hooks/use-client-relays";
import { useRegisterIntersectionEntity } from "../providers/intersection-observer";

function parseHardcodedNoteContent(event: NostrEvent): NostrEvent | null {
  const json = safeJson(event.content, null);
  if (json) verifySignature(json);
  return null;
}

export default function RepostNote({ event, maxHeight }: { event: NostrEvent; maxHeight?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const hardCodedNote = parseHardcodedNoteContent(event);

  const [_, eventId, relay] = event.tags.find(isETag) ?? [];
  const readRelays = useReadRelayUrls(relay ? [relay] : []);

  const {
    value: loadedNote,
    loading,
    error,
  } = useAsync(async () => {
    if (eventId) {
      return singleEventService.requestEvent(eventId, readRelays);
    }
    return null;
  }, [event]);

  const note = hardCodedNote || loadedNote;

  return (
    <TrustProvider event={event}>
      <Flex gap="2" direction="column" ref={ref}>
        <Flex gap="2" alignItems="center" pl="1">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <Heading size="sm" display="inline" isTruncated whiteSpace="pre">
            <UserLink pubkey={event.pubkey} />
          </Heading>
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <Text as="span" whiteSpace="pre" mr="auto">
            Shared note
          </Text>
          <NoteMenu event={event} size="sm" variant="link" aria-label="note options" />
        </Flex>
        {loading ? (
          <SkeletonText />
        ) : note ? (
          <Note event={note} maxHeight={maxHeight} />
        ) : (
          <ErrorFallback error={error} />
        )}
      </Flex>
    </TrustProvider>
  );
}
