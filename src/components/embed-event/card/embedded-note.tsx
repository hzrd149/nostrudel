import { Box, BoxProps, Flex, LinkBox, Spacer } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { MouseEventHandler, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { getSharableEventAddress } from "../../../services/relay-hints";
import { CompactNoteContent } from "../../compact-note-content";
import HoverLinkOverlay from "../../hover-link-overlay";
import { NoteLink } from "../../note/note-link";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedNote({ event, ...props }: Omit<BoxProps, "children" | "as"> & { event: NostrEvent }) {
  const navigate = useNavigate();
  const to = `/n/${getSharableEventAddress(event)}`;

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      navigate(to);
    },
    [navigate, to],
  );

  return (
    <ContentSettingsProvider event={event}>
      <Box
        as={LinkBox}
        borderWidth={0}
        borderLeftWidth={4}
        borderLeftColor="primary.500"
        borderRadius="md"
        pb={2}
        pt={1}
        {...props}
      >
        <Flex p="2" gap="2" alignItems="center" fontSize="sm">
          <UserAvatarLink pubkey={event.pubkey} size="xs" showNip05={false} />
          <UserLink pubkey={event.pubkey} isTruncated fontSize="md" />
          <NoteLink noteId={event.id} whiteSpace="nowrap" color="GrayText">
            <Timestamp timestamp={event.created_at} />
          </NoteLink>
          <HoverLinkOverlay as={RouterLink} to={to} onClick={handleClick} />
          <Spacer />
        </Flex>
        <CompactNoteContent px="2" event={event} maxLength={96} />
      </Box>
    </ContentSettingsProvider>
  );
}
