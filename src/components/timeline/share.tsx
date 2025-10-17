import { Flex, Heading, Text } from "@chakra-ui/react";
import { getEmbededSharedEvent } from "applesauce-core/helpers/share";
import { nip18, NostrEvent } from "nostr-tools";
import { memo, useEffect } from "react";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useSingleEvent from "../../hooks/use-single-event";
import useUserMuteFilter from "../../hooks/use-user-mute-filter";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import { eventStore } from "../../services/event-store";
import LoadingNostrLink from "../loading-nostr-link";
import NoteMenu from "../note/note-menu";
import { TimelineItemContent } from "./timeline-item";
import UserAvatar from "../user/user-avatar";
import UserDnsIdentity from "../user/user-dns-identity";
import UserLink from "../user/user-link";

/** A timeline component for the kind 6 and kind 16 share events */
function TimelineShare({ event }: { event: NostrEvent }) {
  const muteFilter = useUserMuteFilter();
  const wrappedEvent = getEmbededSharedEvent(event);

  useEffect(() => {
    if (wrappedEvent) eventStore.add(wrappedEvent);
  }, [wrappedEvent]);

  const pointer = nip18.getRepostedEventPointer(event);
  const loaded = useSingleEvent(pointer);
  const sharedEvent = wrappedEvent || loaded;

  const ref = useEventIntersectionRef(event);

  if ((sharedEvent && muteFilter(sharedEvent)) || !pointer) return null;

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
        {!sharedEvent ? (
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        ) : (
          <TimelineItemContent event={sharedEvent} />
        )}
      </Flex>
    </ContentSettingsProvider>
  );
}

export default memo(TimelineShare);
