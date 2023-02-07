import React, { useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Box, Card, CardBody, CardFooter, CardHeader, Flex, Heading, IconButton, Link } from "@chakra-ui/react";
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
import { ReplyIcon } from "../icons";
import { PostModalContext } from "../../providers/post-modal-provider";
import { buildReply } from "../../helpers/nostr-event";

export type NoteProps = {
  event: NostrEvent;
};
export const Note = React.memo(({ event }: NoteProps) => {
  const isMobile = useIsMobile();
  const { openModal } = useContext(PostModalContext);

  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);
  const following = contacts?.contacts || [];

  const reply = () => openModal(buildReply(event));

  return (
    <Card variant="outline">
      <CardHeader padding="2" mb="2">
        <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size={isMobile ? "xs" : "sm"} />

          <Heading size="sm" display="inline">
            <UserLink pubkey={event.pubkey} />
          </Heading>
          <Link as={RouterLink} to={`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} whiteSpace="nowrap">
            {moment(event.created_at * 1000).fromNow()}
          </Link>
        </Flex>
      </CardHeader>
      <CardBody px="2" py="0">
        <NoteContents event={event} trusted={following.includes(event.pubkey)} />
      </CardBody>
      <CardFooter padding="2" display="flex" gap="2">
        <IconButton icon={<ReplyIcon />} title="Reply" aria-label="Reply" onClick={reply} size="xs" />
        <Box flexGrow={1} />
        <UserTipButton pubkey={event.pubkey} size="xs" />
        <NoteRelays event={event} size="xs" />
        <NoteMenu event={event} />
      </CardFooter>
    </Card>
  );
});
