import { Flex, Heading, Text } from "@chakra-ui/react";
import { Share } from "applesauce-common/casts";
import { use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { DecodeResult } from "applesauce-core/helpers";
import { memo, useEffect, useMemo } from "react";

import useCastEvent from "../../hooks/use-cast-event";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
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
  const share = useCastEvent(event, Share);
  const wrappedEvent = share?.embedded;

  useEffect(() => {
    if (wrappedEvent) eventStore.add(wrappedEvent);
  }, [wrappedEvent]);

  const loaded = use$(share?.shared$);
  const sharedEvent = wrappedEvent || loaded;

  const link = useMemo<DecodeResult | undefined>(() => {
    if (!share) return undefined;
    if (share.sharedAddressPointer) return { type: "naddr", data: share.sharedAddressPointer };
    return { type: "nevent", data: share.sharedEventPointer };
  }, [share]);

  const ref = useEventIntersectionRef(event);

  if ((sharedEvent && muteFilter(sharedEvent)) || !link) return null;

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
        {!sharedEvent ? <LoadingNostrLink link={link} /> : <TimelineItemContent event={sharedEvent} />}
      </Flex>
    </ContentSettingsProvider>
  );
}

export default memo(TimelineShare);
