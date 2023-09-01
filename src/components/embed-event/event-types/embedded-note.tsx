import dayjs from "dayjs";
import { Button, Card, CardBody, CardHeader, Spacer, useDisclosure } from "@chakra-ui/react";

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

export default function EmbeddedNote({ event }: { event: NostrEvent }) {
  const { showSignatureVerification } = useSubject(appSettings);
  const expand = useDisclosure();

  return (
    <TrustProvider event={event}>
      <Card variant="outline">
        <CardHeader padding="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size="sm" />
          <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <Button size="sm" onClick={expand.onToggle} leftIcon={expand.isOpen ? <ArrowUpSIcon /> : <ArrowDownSIcon />}>
            Expand
          </Button>
          <Spacer />
          {showSignatureVerification && <EventVerificationIcon event={event} />}
          <NoteLink noteId={event.id} color="current" whiteSpace="nowrap">
            {dayjs.unix(event.created_at).fromNow()}
          </NoteLink>
        </CardHeader>
        <CardBody p="0">{expand.isOpen && <NoteContents px="2" event={event} />}</CardBody>
      </Card>
    </TrustProvider>
  );
}
