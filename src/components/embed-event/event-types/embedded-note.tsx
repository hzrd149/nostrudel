import { Button, Card, CardBody, CardHeader, CardProps, Spacer, useDisclosure } from "@chakra-ui/react";

import { NoteContents } from "../../note/note-contents";
import { NostrEvent } from "../../../types/nostr-event";
import { UserAvatarLink } from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import useSubject from "../../../hooks/use-subject";
import appSettings from "../../../services/settings/app-settings";
import EventVerificationIcon from "../../event-verification-icon";
import { TrustProvider } from "../../../providers/trust";
import { NoteLink } from "../../note-link";
import { ArrowDownSIcon, ArrowUpSIcon } from "../../icons";
import Timestamp from "../../timestamp";

export default function EmbeddedNote({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const { showSignatureVerification } = useSubject(appSettings);
  const expand = useDisclosure();

  return (
    <TrustProvider event={event}>
      <Card {...props}>
        <CardHeader padding="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <Button size="sm" onClick={expand.onToggle} leftIcon={expand.isOpen ? <ArrowUpSIcon /> : <ArrowDownSIcon />}>
            Expand
          </Button>
          <Spacer />
          {showSignatureVerification && <EventVerificationIcon event={event} />}
          <NoteLink noteId={event.id} color="current" whiteSpace="nowrap">
            <Timestamp timestamp={event.created_at} />
          </NoteLink>
        </CardHeader>
        <CardBody p="0">{expand.isOpen && <NoteContents px="2" event={event} />}</CardBody>
      </Card>
    </TrustProvider>
  );
}
