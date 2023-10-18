import { useRef } from "react";
import { Flex, Heading, SkeletonText, Text } from "@chakra-ui/react";
import { Kind, validateEvent } from "nostr-tools";

import { isETag, NostrEvent } from "../../../types/nostr-event";
import { Note } from "../../note";
import NoteMenu from "../../note/note-menu";
import { UserAvatar } from "../../user-avatar";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import { UserLink } from "../../user-link";
import { TrustProvider } from "../../../providers/trust";
import { safeJson } from "../../../helpers/parse";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import useSingleEvent from "../../../hooks/use-single-event";
import { EmbedEvent } from "../../embed-event";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";

function parseHardcodedNoteContent(event: NostrEvent) {
  const json = safeJson(event.content, null);
  if (!json) return null;

  // ensure the note has tags
  json.tags = json.tags || [];

  validateEvent(json);

  return (json as NostrEvent) ?? null;
}

export default function RepostNote({ event }: { event: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const muteFilter = useUserMuteFilter();
  const hardCodedNote = parseHardcodedNoteContent(event);

  const [_, eventId, relay] = event.tags.find(isETag) ?? [];
  const readRelays = useReadRelayUrls(relay ? [relay] : []);

  const loadedNote = useSingleEvent(eventId, readRelays);
  const note = hardCodedNote || loadedNote;

  if (note && muteFilter(note)) return;

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
        {!note ? (
          <SkeletonText />
        ) : note.kind === Kind.Text ? (
          // NOTE: tell the note not to register itself with the intersection observer. since this is an older note it will break the order of the timeline
          <Note event={note} showReplyButton registerIntersectionEntity={false} />
        ) : (
          <EmbedEvent event={note} />
        )}
      </Flex>
    </TrustProvider>
  );
}
