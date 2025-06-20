import { Flex, Heading, Text } from "@chakra-ui/react";
import { getEmbededSharedEvent } from "applesauce-core/helpers/share";
import { kinds, nip18, NostrEvent } from "nostr-tools";
import { memo, useEffect } from "react";

import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useSingleEvent from "../../../hooks/use-single-event";
import useUserMuteFilter from "../../../hooks/use-user-mute-filter";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { eventStore } from "../../../services/event-store";
import { EmbedEventCard } from "../../embed-event/card";
import LoadingNostrLink from "../../loading-nostr-link";
import NoteMenu from "../../note/note-menu";
import TimelineNote from "../../note/timeline-note";
import UserAvatar from "../../user/user-avatar";
import UserDnsIdentity from "../../user/user-dns-identity";
import UserLink from "../../user/user-link";

function ShareEvent({ event }: { event: NostrEvent }) {
  const muteFilter = useUserMuteFilter();
  const hardCodedNote = getEmbededSharedEvent(event);

  useEffect(() => {
    if (hardCodedNote) eventStore.add(hardCodedNote);
  }, [hardCodedNote]);

  const pointer = nip18.getRepostedEventPointer(event);
  const loadedNote = useSingleEvent(pointer);
  const note = hardCodedNote || loadedNote;

  const ref = useEventIntersectionRef(event);

  if ((note && muteFilter(note)) || !pointer) return null;

  return (
    <ContentSettingsProvider event={event}>
      <Flex gap="2" direction="column" ref={ref}>
        <Flex gap="2" alignItems="center" pl="1">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <Heading size="sm" display="inline" isTruncated whiteSpace="pre">
            <UserLink pubkey={event.pubkey} />
          </Heading>
          <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
          <Text as="span">Shared</Text>
          <NoteMenu event={event} size="sm" variant="ghost" aria-label="note options" ml="auto" />
        </Flex>
        {!note ? (
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        ) : note.kind === kinds.ShortTextNote ? (
          // NOTE: tell the note not to register itself with the intersection observer. since this is an older note it will break the order of the timeline
          <TimelineNote event={note} showReplyButton registerIntersectionEntity={false} />
        ) : (
          <EmbedEventCard event={note} />
        )}
      </Flex>
    </ContentSettingsProvider>
  );
}

export default memo(ShareEvent);
