import { useRef } from "react";
import { Box, ButtonGroup, Card, CardBody, CardFooter, CardHeader, CardProps, Flex } from "@chakra-ui/react";

import useCurrentAccount from "../../hooks/use-current-account";
import { getMessageRecipient } from "../../services/direct-messages";
import { NostrEvent } from "../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import {
  embedCashuTokens,
  embedNostrLinks,
  renderGenericUrl,
  renderImageUrl,
  renderVideoUrl,
} from "../../components/embed-types";
import { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import UserAvatar from "../../components/user-avatar";
import { getEventUID } from "../../helpers/nostr/events";
import Timestamp from "../../components/timestamp";
import NoteZapButton from "../../components/note/note-zap-button";
import UserLink from "../../components/user-link";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import EventReactionButtons from "../../components/event-reactions/event-reactions";
import useEventReactions from "../../hooks/use-event-reactions";
import AddReactionButton from "../../components/note/components/add-reaction-button";
import { TrustProvider } from "../../providers/trust";

export function MessageContent({ event, text }: { event: NostrEvent; text: string }) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  // cashu
  content = embedCashuTokens(content);

  return (
    <TrustProvider event={event}>
      <Box whiteSpace="pre-wrap" display="inline">
        {content}
      </Box>
    </TrustProvider>
  );
}

export default function Message({ event }: { event: NostrEvent } & Omit<CardProps, "children">) {
  const account = useCurrentAccount()!;
  const isOwn = account.pubkey === event.pubkey;

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  const avatar = <UserAvatar pubkey={event.pubkey} size="sm" my="1" />;
  const reactions = useEventReactions(event.id) ?? [];

  return (
    <Flex direction="row" gap="2" alignItems="flex-end" ref={ref}>
      {!isOwn && avatar}
      <Card variant="outline" w="full" ml={isOwn ? "auto" : 0} mr={isOwn ? 0 : "auto"} maxW="2xl">
        {!isOwn && (
          <CardHeader px="2" pt="2" pb="0" gap="2" display="flex" alignItems="center">
            <UserLink pubkey={event.pubkey} fontWeight="bold" />
            <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
            <NoteZapButton event={event} size="xs" ml="auto" variant="ghost" />
            <AddReactionButton event={event} size="xs" variant="ghost" />
          </CardHeader>
        )}
        <CardBody px="2" py="2">
          <DecryptPlaceholder
            data={event.content}
            pubkey={isOwn ? getMessageRecipient(event) ?? "" : event.pubkey}
            variant="link"
            py="4"
          >
            {(text) => <MessageContent event={event} text={text} />}
          </DecryptPlaceholder>
          {reactions.length === 0 && <Timestamp float="right" timestamp={event.created_at} />}
        </CardBody>
        {reactions.length > 0 && (
          <CardFooter alignItems="center" display="flex" gap="2" px="2" pt="0" pb="2">
            <ButtonGroup size="sm" mr="auto" variant="ghost">
              <EventReactionButtons event={event} />
            </ButtonGroup>
            <Timestamp ml="auto" timestamp={event.created_at} />
          </CardFooter>
        )}
      </Card>
      {isOwn && avatar}
    </Flex>
  );
}
