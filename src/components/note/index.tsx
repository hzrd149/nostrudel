import React from "react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Box, Card, CardBody, CardHeader, Flex, Heading, Link } from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { NoteContents } from "./note-contents";
import { NoteMenu } from "./note-menu";
import useSubject from "../../hooks/use-subject";
import identity from "../../services/identity";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { UserTipButton } from "../user-tip-button";
import { NoteRelays } from "./note-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserLink } from "../user-link";

export type NoteProps = {
  event: NostrEvent;
};
export const Note = React.memo(({ event }: NoteProps) => {
  const isMobile = useIsMobile();

  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);
  const following = contacts?.contacts || [];

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0" mb="2">
        <Flex gap="2">
          <Flex flex="1" gap="2">
            <UserAvatarLink pubkey={event.pubkey} size={isMobile ? "xs" : "sm"} />

            <Box>
              <Heading size="sm" display="inline">
                <UserLink pubkey={event.pubkey} />
              </Heading>
              <span> </span>
              <Link as={RouterLink} to={`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} whiteSpace="nowrap">
                {moment(event.created_at * 1000).fromNow()}
              </Link>
            </Box>
          </Flex>
          <UserTipButton pubkey={event.pubkey} size="xs" />
          <NoteRelays event={event} size="xs" />
          <NoteMenu event={event} />
        </Flex>
      </CardHeader>
      <CardBody padding="0">
        <Box overflow="hidden" width="100%">
          <NoteContents event={event} trusted={following.includes(event.pubkey)} />
        </Box>
      </CardBody>
    </Card>
  );
});
