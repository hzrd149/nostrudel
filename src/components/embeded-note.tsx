import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Card, CardBody, CardHeader, Flex, Heading, Link, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { useIsMobile } from "../hooks/use-is-mobile";
import { NoteContents } from "./note/note-contents";
import { useUserContacts } from "../hooks/use-user-contacts";
import { useCurrentAccount } from "../hooks/use-current-account";
import { NostrEvent } from "../types/nostr-event";
import { UserAvatarLink } from "./user-avatar-link";
import { UserLink } from "./user-link";
import { UserDnsIdentityIcon } from "./user-dns-identity";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { convertTimestampToDate } from "../helpers/date";

const EmbeddedNote = ({ note }: { note: NostrEvent }) => {
  const isMobile = useIsMobile();
  const account = useCurrentAccount();

  const contacts = useUserContacts(account.pubkey);
  const following = contacts?.contacts || [];

  return (
    <LinkBox as={Card} variant="outline">
      <CardHeader padding="2">
        <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={note.pubkey} size="xs" />

          <Heading size="sm" display="inline">
            <UserLink pubkey={note.pubkey} />
          </Heading>
          <UserDnsIdentityIcon pubkey={note.pubkey} onlyIcon />
          {!isMobile && <Flex grow={1} />}
          <Text whiteSpace="nowrap">{moment(convertTimestampToDate(note.created_at)).fromNow()}</Text>
        </Flex>
      </CardHeader>
      <CardBody px="2" pt="0" pb="2">
        <NoteContents event={note} trusted={following.includes(note.pubkey)} maxHeight={200} />
      </CardBody>
      <LinkOverlay as={RouterLink} to={`/n/${normalizeToBech32(note.id, Bech32Prefix.Note)}`} />
    </LinkBox>
  );
};

export default EmbeddedNote;
