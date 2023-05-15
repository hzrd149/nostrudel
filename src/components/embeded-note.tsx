import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Card, CardBody, CardHeader, Flex, Heading, Link } from "@chakra-ui/react";
import { useIsMobile } from "../hooks/use-is-mobile";
import { NoteContents } from "./note/note-contents";
import { useUserContacts } from "../hooks/use-user-contacts";
import { useCurrentAccount } from "../hooks/use-current-account";
import { NostrEvent } from "../types/nostr-event";
import { UserAvatarLink } from "./user-avatar-link";
import { UserLink } from "./user-link";
import { UserDnsIdentityIcon } from "./user-dns-identity";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip19";
import { convertTimestampToDate } from "../helpers/date";
import useSubject from "../hooks/use-subject";
import appSettings from "../services/app-settings";
import EventVerificationIcon from "./event-verification-icon";
import { useReadRelayUrls } from "../hooks/use-client-relays";

const EmbeddedNote = ({ note }: { note: NostrEvent }) => {
  const account = useCurrentAccount();
  const { showSignatureVerification } = useSubject(appSettings);

  const readRelays = useReadRelayUrls();
  const contacts = useUserContacts(account.pubkey, readRelays);
  const following = contacts?.contacts || [];

  return (
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
          <Link as={RouterLink} to={`/n/${normalizeToBech32(note.id, Bech32Prefix.Note)}`} whiteSpace="nowrap">
            {moment(convertTimestampToDate(note.created_at)).fromNow()}
          </Link>
        </Flex>
      </CardHeader>
      <CardBody p="0">
        <NoteContents event={note} trusted={following.includes(note.pubkey)} maxHeight={200} />
      </CardBody>
    </Card>
  );
};

export default EmbeddedNote;
