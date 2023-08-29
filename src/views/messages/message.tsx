import { Box, Card, CardBody, CardHeader, CardProps, Flex, Heading, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { getMessageRecipient } from "../../services/direct-messages";
import { NostrEvent } from "../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl, renderImageUrl, renderVideoUrl } from "../../components/embed-types";
import { useRef } from "react";
import { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { getEventUID } from "../../helpers/nostr/events";

export function MessageContent({ event, text }: { event: NostrEvent; text: string }) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  return <Box whiteSpace="pre-wrap">{content}</Box>;
}

export function Message({ event }: { event: NostrEvent } & Omit<CardProps, "children">) {
  const account = useCurrentAccount()!;
  const isOwnMessage = account.pubkey === event.pubkey;

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Flex direction="column" ref={ref}>
      <Card size="sm">
        <CardHeader display="flex" gap="2" alignItems="center" pb="0">
          <UserAvatar pubkey={event.pubkey} size="xs" />
          <Heading size="md">
            <UserLink pubkey={event.pubkey} />
          </Heading>
          <Text ml="auto">{dayjs.unix(event.created_at).fromNow()}</Text>
        </CardHeader>
        <CardBody position="relative">
          <DecryptPlaceholder
            data={event.content}
            pubkey={isOwnMessage ? getMessageRecipient(event) ?? "" : event.pubkey}
          >
            {(text) => <MessageContent event={event} text={text} />}
          </DecryptPlaceholder>
        </CardBody>
      </Card>
    </Flex>
  );
}
