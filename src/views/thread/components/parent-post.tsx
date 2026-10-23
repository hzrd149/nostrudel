import { Box, Link, LinkBox, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { EmbedEventCard } from "../../../components/embed-event/card";
import ExpandableToggleButton from "../../../components/expandable-toggle-button";
import TextNoteContents from "../../../components/timeline/note/text-note-contents";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../../components/user/user-dns-identity-icon";
import UserLink from "../../../components/user/user-link";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { getSharableEventAddress } from "../../../services/relay-hints";
import MutedNotePlaceholder from "./muted-note-placeholder";

export default function ParentPost({ event, level }: { event: NostrEvent; level: number }) {
  const ref = useEventIntersectionRef(event);
  const more = useDisclosure({ defaultIsOpen: level < 2 });
  const muteFilter = useClientSideMuteFilter();
  const isMuted = muteFilter(event);
  const [alwaysShow, setAlwaysShow] = useState(false);

  return (
    <LinkBox
      gap="2"
      overflow="hidden"
      p="2"
      flexShrink={0}
      borderWidth="0 2px 0 2px"
      rounded="none"
      borderColor="var(--chakra-colors-chakra-border-color)"
      ref={ref}
      as="article"
    >
      <ExpandableToggleButton toggle={more} aria-label={more.isOpen ? "Collapse post" : "Expand post"} float="right" />
      <Box float="left" mr="2">
        <UserAvatarLink pubkey={event.pubkey} size="xs" mr="2" aria-label="avatar" />
        <UserLink pubkey={event.pubkey} fontWeight="bold" mr="1" />
        <UserDnsIdentityIcon pubkey={event.pubkey} mr="2" />
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(event)}`}
          aria-label={`Posted at ${new Date(event.created_at * 1000).toLocaleString()}`}
        >
          <Timestamp timestamp={event.created_at} />
        </Link>
      </Box>
      {more.isOpen ? (
        isMuted && !alwaysShow ? (
          <MutedNotePlaceholder event={event} showHeader={false} onShowAnyway={() => setAlwaysShow(true)} />
        ) : (
          <ContentSettingsProvider blurMedia={false}>
            <br />
            {event.kind === 1 || event.kind === 1111 ? (
              <TextNoteContents event={event} aria-expanded="true" />
            ) : (
              <EmbedEventCard event={event} borderWidth={0} rounded="none" />
            )}
          </ContentSettingsProvider>
        )
      ) : (
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(event)}`}
          noOfLines={1}
          fontStyle="italic"
          aria-expanded="false"
        >
          {isMuted ? "Muted user or note" : event.content}
        </Link>
      )}
    </LinkBox>
  );
}
