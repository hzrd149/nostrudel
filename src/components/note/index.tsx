import React, { useContext } from "react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { Box, Card, CardBody, CardFooter, CardHeader, Flex, Heading, IconButton, Link, Text } from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { UserAvatarLink } from "../user-avatar-link";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { NoteContents } from "./note-contents";
import { NoteMenu } from "./note-menu";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { UserTipButton } from "../user-tip-button";
import { NoteRelays } from "./note-relays";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { UserLink } from "../user-link";
import { ReplyIcon, ShareIcon } from "../icons";
import { PostModalContext } from "../../providers/post-modal-provider";
import { buildReply, buildShare } from "../../helpers/nostr-event";
import { UserDnsIdentityIcon } from "../user-dns-identity";
import { convertTimestampToDate } from "../../helpers/date";
import { useCurrentAccount } from "../../hooks/use-current-account";

export type NoteProps = {
  event: NostrEvent;
  maxHeight?: number;
};
export const Note = React.memo(({ event, maxHeight }: NoteProps) => {
  const isMobile = useIsMobile();
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);

  const contacts = useUserContacts(account.pubkey);
  const following = contacts?.contacts || [];

  const reply = () => openModal(buildReply(event));
  const share = () => openModal(buildShare(event));

  return (
    <Card variant="outline">
      <CardHeader padding="2">
        <Flex flex="1" gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={event.pubkey} size={isMobile ? "xs" : "sm"} />

          <Heading size="sm" display="inline">
            <UserLink pubkey={event.pubkey} />
          </Heading>
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
          {!isMobile && <Flex grow={1} />}
          <Link as={RouterLink} to={`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} whiteSpace="nowrap">
            {moment(convertTimestampToDate(event.created_at)).fromNow()}
          </Link>
        </Flex>
      </CardHeader>
      <CardBody px="2" py="0">
        <NoteContents event={event} trusted={following.includes(event.pubkey)} maxHeight={maxHeight} />
      </CardBody>
      <CardFooter padding="2" display="flex" gap="2">
        <UserTipButton pubkey={event.pubkey} eventId={event.id} size="xs" />
        <IconButton
          icon={<ReplyIcon />}
          title="Reply"
          aria-label="Reply"
          onClick={reply}
          size="xs"
          isDisabled={account.readonly}
        />
        <IconButton
          icon={<ShareIcon />}
          onClick={share}
          aria-label="Share Note"
          title="Share Note"
          size="xs"
          isDisabled={account.readonly}
        />
        <Box flexGrow={1} />
        <NoteRelays event={event} size="xs" />
        <NoteMenu event={event} />
      </CardFooter>
    </Card>
  );
});
