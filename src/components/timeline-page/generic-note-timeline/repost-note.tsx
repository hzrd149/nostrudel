import { useRef } from "react";
import { Flex, Heading, Link, SkeletonText, Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { isATag, isETag, NostrEvent } from "../../../types/nostr-event";
import { Note } from "../../note";
import NoteMenu from "../../note/note-menu";
import UserAvatar from "../../user-avatar";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import { UserLink } from "../../user-link";
import { TrustProvider } from "../../../providers/trust";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import useSingleEvent from "../../../hooks/use-single-event";
import { EmbedEvent } from "../../embed-event";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";
import { parseCoordinate, parseHardcodedNoteContent } from "../../../helpers/nostr/events";
import { COMMUNITY_DEFINITION_KIND } from "../../../helpers/nostr/communities";

export default function RepostNote({ event }: { event: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  const muteFilter = useUserMuteFilter();
  const hardCodedNote = parseHardcodedNoteContent(event);

  const [_, eventId, relay] = event.tags.find(isETag) ?? [];
  const readRelays = useReadRelayUrls(relay ? [relay] : []);

  const loadedNote = useSingleEvent(eventId, readRelays);
  const note = hardCodedNote || loadedNote;

  const communityTag = event.tags.filter(isATag).find((t) => t[1].startsWith(COMMUNITY_DEFINITION_KIND + ":"));
  const communityCoordinate = communityTag && parseCoordinate(communityTag[1]);

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
          <Text as="span" whiteSpace="pre">
            {communityCoordinate ? `Shared to` : `Shared`}
          </Text>
          {communityCoordinate && (
            <Link
              as={RouterLink}
              to={`/c/${communityCoordinate.identifier}/${communityCoordinate.pubkey}`}
              fontWeight="bold"
            >
              {communityCoordinate.identifier}
            </Link>
          )}
          <NoteMenu event={event} size="sm" variant="link" aria-label="note options" ml="auto" />
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
