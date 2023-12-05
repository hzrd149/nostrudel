import { useRef } from "react";
import { Box, CardProps, Flex } from "@chakra-ui/react";

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
import UserLink from "../../components/user-link";
import { getEventUID } from "../../helpers/nostr/events";
import Timestamp from "../../components/timestamp";

export function MessageContent({ event, text }: { event: NostrEvent; text: string }) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  // cashu
  content = embedCashuTokens(content);

  return <Box whiteSpace="pre-wrap">{content}</Box>;
}

export default function Message({ event }: { event: NostrEvent } & Omit<CardProps, "children">) {
  const account = useCurrentAccount()!;
  const isOwnMessage = account.pubkey === event.pubkey;

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Flex direction="column" gap="2" ref={ref}>
      <Flex gap="2" mr="2">
        <UserAvatar pubkey={event.pubkey} size="xs" />
        <UserLink pubkey={event.pubkey} fontWeight="bold" />
        <Timestamp ml="auto" timestamp={event.created_at} />
      </Flex>
      <DecryptPlaceholder data={event.content} pubkey={isOwnMessage ? getMessageRecipient(event) ?? "" : event.pubkey}>
        {(text) => <MessageContent event={event} text={text} />}
      </DecryptPlaceholder>
    </Flex>
  );
}
