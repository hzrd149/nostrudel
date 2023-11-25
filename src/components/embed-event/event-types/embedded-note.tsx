import { MouseEventHandler, useCallback } from "react";
import { Card, CardProps, Flex, LinkBox, Spacer } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import useSubject from "../../../hooks/use-subject";
import appSettings from "../../../services/settings/app-settings";
import EventVerificationIcon from "../../event-verification-icon";
import { TrustProvider } from "../../../providers/trust";
import { NoteLink } from "../../note-link";
import Timestamp from "../../timestamp";
import { getSharableEventAddress } from "../../../helpers/nip19";
import { InlineNoteContent } from "../../inline-note-content";
import { useNavigateInDrawer } from "../../../providers/drawer-sub-view-provider";
import HoverLinkOverlay from "../../hover-link-overlay";

export default function EmbeddedNote({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const { showSignatureVerification } = useSubject(appSettings);
  const navigate = useNavigateInDrawer();
  const to = `/n/${getSharableEventAddress(event)}`;

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      navigate(to);
    },
    [navigate, to],
  );

  return (
    <TrustProvider event={event}>
      <Card as={LinkBox} {...props}>
        <Flex p="2" gap="2" alignItems="center">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <HoverLinkOverlay as={RouterLink} to={to} onClick={handleClick} />
          <Spacer />
          {showSignatureVerification && <EventVerificationIcon event={event} />}
          <NoteLink noteId={event.id} color="current" whiteSpace="nowrap">
            <Timestamp timestamp={event.created_at} />
          </NoteLink>
        </Flex>
        <InlineNoteContent px="2" event={event} maxLength={96} />
      </Card>
    </TrustProvider>
  );
}
