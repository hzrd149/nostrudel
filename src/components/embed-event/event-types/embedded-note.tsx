import { MouseEventHandler, useCallback } from "react";
import { Card, CardProps, Flex, LinkBox, Spacer } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import useSubject from "../../../hooks/use-subject";
import EventVerificationIcon from "../../common-event/event-verification-icon";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { NoteLink } from "../../note/note-link";
import Timestamp from "../../timestamp";
import { CompactNoteContent } from "../../compact-note-content";
import { useNavigateInDrawer } from "../../../providers/drawer-sub-view-provider";
import HoverLinkOverlay from "../../hover-link-overlay";
import singleEventService from "../../../services/single-event";
import { getSharableEventAddress } from "../../../services/event-relay-hint";
import localSettings from "../../../services/local-settings";
import useAppSettings from "../../../hooks/use-app-settings";

export default function EmbeddedNote({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const { showSignatureVerification } = useAppSettings();
  const enableDrawer = useSubject(localSettings.enableNoteThreadDrawer);
  const navigate = enableDrawer ? useNavigateInDrawer() : useNavigate();
  const to = `/n/${getSharableEventAddress(event)}`;

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      singleEventService.handleEvent(event);
      navigate(to);
    },
    [navigate, to],
  );

  return (
    <TrustProvider event={event}>
      <Card as={LinkBox} {...props}>
        <Flex p="2" gap="2" alignItems="center">
          <UserAvatarLink pubkey={event.pubkey} size="sm" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <NoteLink noteId={event.id} color="current" whiteSpace="nowrap">
            <Timestamp timestamp={event.created_at} />
          </NoteLink>
          <HoverLinkOverlay as={RouterLink} to={to} onClick={handleClick} />
          <Spacer />
          {showSignatureVerification && <EventVerificationIcon event={event} />}
        </Flex>
        <CompactNoteContent px="2" event={event} maxLength={96} />
      </Card>
    </TrustProvider>
  );
}
