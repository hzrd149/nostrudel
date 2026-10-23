import { Box, Flex, Link } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-common/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { EmbedEventCard } from "../../../components/embed-event/card";
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

export default function ParentPost({ event }: { event: NostrEvent }) {
  const ref = useEventIntersectionRef(event);
  const muteFilter = useClientSideMuteFilter();
  const isMuted = muteFilter(event);
  const [alwaysShow, setAlwaysShow] = useState(false);
  const isNote = event.kind === kinds.ShortTextNote || event.kind === COMMENT_KIND;

  if (isMuted && !alwaysShow) {
    return (
      <Box ref={ref}>
        <MutedNotePlaceholder event={event} onShowAnyway={() => setAlwaysShow(true)} />
      </Box>
    );
  }

  return (
    <ContentSettingsProvider blurMedia={false} event={event}>
      {isNote ? (
        <Flex as="article" direction="column" gap="2" p="2" flexShrink={0} minW={0} ref={ref}>
          <Flex gap="2" alignItems="center" flexWrap="wrap">
            <UserAvatarLink pubkey={event.pubkey} size="xs" aria-label="avatar" />
            <UserLink pubkey={event.pubkey} fontWeight="bold" />
            <UserDnsIdentityIcon pubkey={event.pubkey} />
            <Link
              as={RouterLink}
              to={`/n/${getSharableEventAddress(event)}`}
              aria-label={`Posted at ${new Date(event.created_at * 1000).toLocaleString()}`}
            >
              <Timestamp timestamp={event.created_at} />
            </Link>
          </Flex>
          <TextNoteContents event={event} />
        </Flex>
      ) : (
        <Box ref={ref} minW={0} flexShrink={0}>
          <EmbedEventCard event={event} />
        </Box>
      )}
    </ContentSettingsProvider>
  );
}
