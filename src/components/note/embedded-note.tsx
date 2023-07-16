import dayjs from "dayjs";
import { Button, Card, CardBody, CardHeader, Spacer, useDisclosure } from "@chakra-ui/react";

import { NoteContents } from "./note-contents";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity-icon";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { TrustProvider } from "../../providers/trust";
import { NoteLink } from "../note-link";
import { ArrowDownSIcon, ArrowUpSIcon } from "../icons";

export default function EmbeddedNote({ note }: { note: NostrEvent }) {
  const { showSignatureVerification } = useSubject(appSettings);
  const expand = useDisclosure();

  return (
    <TrustProvider event={note}>
      <Card variant="outline">
        <CardHeader padding="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
          <UserAvatarLink pubkey={note.pubkey} size="sm" />
          <UserLink pubkey={note.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <UserDnsIdentityIcon pubkey={note.pubkey} onlyIcon />
          <Button size="sm" onClick={expand.onToggle} leftIcon={expand.isOpen ? <ArrowUpSIcon /> : <ArrowDownSIcon />}>
            Expand
          </Button>
          <Spacer />
          {showSignatureVerification && <EventVerificationIcon event={note} />}
          <NoteLink noteId={note.id} color="current" whiteSpace="nowrap">
            {dayjs.unix(note.created_at).fromNow()}
          </NoteLink>
        </CardHeader>
        <CardBody p="0">{expand.isOpen && <NoteContents event={note} />}</CardBody>
      </Card>
    </TrustProvider>
  );
}
