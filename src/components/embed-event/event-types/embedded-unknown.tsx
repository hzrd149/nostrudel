import { Box, Button, Card, CardBody, CardHeader, CardProps, Flex, Link, Text, useDisclosure } from "@chakra-ui/react";

import { getSharableEventAddress } from "../../../helpers/nip19";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user-avatar-link";
import { UserLink } from "../../user-link";
import { truncatedId } from "../../../helpers/nostr/events";
import { buildAppSelectUrl } from "../../../helpers/nostr/apps";
import { UserDnsIdentityIcon } from "../../user-dns-identity-icon";
import { useMemo } from "react";
import { embedEmoji, embedNostrHashtags, embedNostrLinks, embedNostrMentions } from "../../embed-types";
import { EmbedableContent } from "../../../helpers/embeds";
import Timestamp from "../../timestamp";
import { CodeIcon } from "../../icons";
import NoteDebugModal from "../../debug-modals/note-debug-modal";

export default function EmbeddedUnknown({ event, ...props }: Omit<CardProps, "children"> & { event: NostrEvent }) {
  const debugModal = useDisclosure();
  const address = getSharableEventAddress(event);

  const content = useMemo(() => {
    let jsx: EmbedableContent = [event.content];
    jsx = embedNostrLinks(jsx);
    jsx = embedNostrMentions(jsx, event);
    jsx = embedNostrHashtags(jsx, event);
    jsx = embedEmoji(jsx, event);

    return jsx;
  }, [event.content]);

  return (
    <>
      <Card {...props}>
        <CardHeader display="flex" gap="2" alignItems="center" p="2" pb="0" flexWrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size="xs" />
          <UserLink pubkey={event.pubkey} isTruncated fontWeight="bold" fontSize="md" />
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          <Link ml="auto" href={address ? buildAppSelectUrl(address) : ""} isExternal>
            <Timestamp timestamp={event.created_at} />
          </Link>
        </CardHeader>
        <CardBody p="2">
          <Flex gap="2">
            <Text>Kind: {event.kind}</Text>
            <Link href={address ? buildAppSelectUrl(address) : ""} isExternal color="blue.500">
              {address && truncatedId(address)}
            </Link>
            <Button leftIcon={<CodeIcon />} ml="auto" size="sm" variant="outline" onClick={debugModal.onOpen}>
              View Raw
            </Button>
          </Flex>
          <Box whiteSpace="pre-wrap">{content}</Box>
        </CardBody>
      </Card>
      {debugModal.isOpen && <NoteDebugModal isOpen={debugModal.isOpen} onClose={debugModal.onClose} event={event} />}
    </>
  );
}
