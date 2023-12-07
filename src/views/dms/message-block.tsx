import { useRef } from "react";
import { Box, BoxProps, Card, CardBody, CardFooter, CardHeader, CardProps, Flex } from "@chakra-ui/react";

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
import useEventReactions from "../../hooks/use-event-reactions";
import AddReactionButton from "../../components/note/components/add-reaction-button";
import { TrustProvider } from "../../providers/trust";
import NoteReactions from "../../components/note/components/note-reactions";

export function MessageContent({ event, text, children, ...props }: { event: NostrEvent; text: string } & BoxProps) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  // cashu
  content = embedCashuTokens(content);

  return (
    <TrustProvider event={event}>
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
        {children}
      </Box>
    </TrustProvider>
  );
}

function MessageBubble({
  event,
  showHeader = true,
  ...props
}: { event: NostrEvent; showHeader?: boolean } & Omit<CardProps, "children">) {
  const account = useCurrentAccount()!;
  const isOwn = account.pubkey === event.pubkey;
  const reactions = useEventReactions(event.id) ?? [];
  const hasReactions = reactions.length > 0;

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Card {...props} borderRadius="lg" ref={ref}>
      {showHeader && (
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
          px="6rem"
        >
          {(text) => (
            <MessageContent event={event} text={text} display="inline">
              {!hasReactions && (
                <Flex float="right">
                  {!showHeader && (
                    <>
                      <NoteZapButton event={event} size="xs" ml="auto" variant="ghost" />
                      <AddReactionButton event={event} size="xs" variant="ghost" ml="1" />
                    </>
                  )}
                  <Timestamp timestamp={event.created_at} ml="2" />
                </Flex>
              )}
            </MessageContent>
          )}
        </DecryptPlaceholder>
      </CardBody>
      {hasReactions && (
        <CardFooter alignItems="center" display="flex" gap="2" px="2" pt="0" pb="2">
          <NoteReactions event={event} size="xs" variant="ghost" />
          <NoteZapButton event={event} size="xs" mr="auto" variant="ghost" />
          <Timestamp ml="auto" timestamp={event.created_at} />
        </CardFooter>
      )}
    </Card>
  );
}

export default function MessageBlock({ events }: { events: NostrEvent[] } & Omit<CardProps, "children">) {
  const lastEvent = events[events.length - 1];
  const account = useCurrentAccount()!;
  const isOwn = account.pubkey === lastEvent.pubkey;

  const avatar = <UserAvatar pubkey={lastEvent.pubkey} size="sm" my="1" />;

  return (
    <Flex direction="row" gap="2" alignItems="flex-end">
      {!isOwn && avatar}
      <Flex
        direction="column-reverse"
        gap="1"
        ml={isOwn ? "auto" : 0}
        mr={isOwn ? 0 : "auto"}
        maxW="2xl"
        alignItems={isOwn ? "flex-end" : "flex-start"}
        overflowX="hidden"
        overflowY="visible"
      >
        {events.map((event, i, arr) => (
          <MessageBubble
            key={event.id}
            event={event}
            showHeader={i === arr.length - 1}
            minW={{ base: 0, sm: "sm", md: "md" }}
            overflow="hidden"
          />
        ))}
      </Flex>
      {isOwn && avatar}
    </Flex>
  );
}
