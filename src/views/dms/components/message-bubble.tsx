import { useRef } from "react";
import { Box, BoxProps, Card, CardBody, CardFooter, CardHeader, CardProps, Flex } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import {
  embedCashuTokens,
  embedNostrLinks,
  renderGenericUrl,
  renderImageUrl,
  renderVideoUrl,
} from "../../../components/embed-types";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { getEventUID } from "../../../helpers/nostr/events";
import Timestamp from "../../../components/timestamp";
import NoteZapButton from "../../../components/note/note-zap-button";
import UserLink from "../../../components/user-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import useEventReactions from "../../../hooks/use-event-reactions";
import AddReactionButton from "../../../components/note/components/add-reaction-button";
import { TrustProvider } from "../../../providers/trust";
import NoteReactions from "../../../components/note/components/note-reactions";

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

export type MessageBubbleProps = { message: NostrEvent; showHeader?: boolean } & Omit<CardProps, "children">;

export default function MessageBubble({ message, showHeader = true, ...props }: MessageBubbleProps) {
  const reactions = useEventReactions(message.id) ?? [];
  const hasReactions = reactions.length > 0;

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(message));

  return (
    <Card {...props} borderRadius="lg" ref={ref}>
      {showHeader && (
        <CardHeader px="2" pt="2" pb="0" gap="2" display="flex" alignItems="center">
          <UserLink pubkey={message.pubkey} fontWeight="bold" />
          <UserDnsIdentityIcon pubkey={message.pubkey} onlyIcon />
          <NoteZapButton event={message} size="xs" ml="auto" variant="ghost" />
          <AddReactionButton event={message} size="xs" variant="ghost" />
        </CardHeader>
      )}
      <CardBody px="2" py="2">
        <DecryptPlaceholder message={message} variant="link" py="4" px="6rem">
          {(plaintext) => (
            <MessageContent event={message} text={plaintext} display="inline">
              {!hasReactions && (
                <Flex float="right">
                  {!showHeader && (
                    <>
                      <NoteZapButton event={message} size="xs" ml="2" variant="ghost" />
                      <AddReactionButton event={message} size="xs" variant="ghost" ml="1" />
                    </>
                  )}
                  <Timestamp timestamp={message.created_at} ml="2" />
                </Flex>
              )}
            </MessageContent>
          )}
        </DecryptPlaceholder>
      </CardBody>
      {hasReactions && (
        <CardFooter alignItems="center" display="flex" gap="2" px="2" pt="0" pb="2">
          <NoteReactions event={message} size="xs" variant="ghost" />
          <NoteZapButton event={message} size="xs" mr="auto" variant="ghost" />
          <Timestamp ml="auto" timestamp={message.created_at} />
        </CardFooter>
      )}
    </Card>
  );
}
