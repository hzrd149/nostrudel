import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Card, CardBody, CardHeader, Flex, Heading, Link } from "@chakra-ui/react";
import { NoteContents } from "./note-contents";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { UserLink } from "../user-link";
import { UserDnsIdentityIcon } from "../user-dns-identity";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip19";
import { convertTimestampToDate } from "../../helpers/date";
import useSubject from "../../hooks/use-subject";
import appSettings from "../../services/app-settings";
import EventVerificationIcon from "../event-verification-icon";
import { TrustProvider } from "./trust";
import { NoteLink } from "../note-link";

export default function EmbeddedNote({ note }: { note: NostrEvent }) {
  const { showSignatureVerification } = useSubject(appSettings);

  return (
    <TrustProvider event={note}>
      <Card variant="outline">
        <CardHeader padding="2">
          <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
            <UserAvatarLink pubkey={note.pubkey} size="xs" />

            <Heading size="sm" display="inline">
              <UserLink pubkey={note.pubkey} />
            </Heading>
            <UserDnsIdentityIcon pubkey={note.pubkey} onlyIcon />
            <Flex grow={1} />
            {showSignatureVerification && <EventVerificationIcon event={note} />}
            <NoteLink noteId={note.id} color="current" whiteSpace="nowrap">
              {moment(convertTimestampToDate(note.created_at)).fromNow()}
            </NoteLink>
          </Flex>
        </CardHeader>
        <CardBody p="0">
          <NoteContents event={note} maxHeight={200} />
        </CardBody>
      </Card>
    </TrustProvider>
  );
}
