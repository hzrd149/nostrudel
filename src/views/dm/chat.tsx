import { Box, Button, Card, CardBody, CardProps, Flex, IconButton, Spacer, Text, Textarea } from "@chakra-ui/react";
import dayjs from "dayjs";
import { Kind } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { ArrowLeftSIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { normalizeToHex } from "../../helpers/nip19";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useIsMobile } from "../../hooks/use-is-mobile";
import useSubject from "../../hooks/use-subject";
import { useSigningContext } from "../../providers/signing-provider";
import clientRelaysService from "../../services/client-relays";
import directMessagesService, { getMessageRecipient } from "../../services/direct-messages";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl, renderImageUrl, renderVideoUrl } from "../../components/embed-types";
import RequireCurrentAccount from "../../providers/require-current-account";

function MessageContent({ event, text }: { event: NostrEvent; text: string }) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);

  content = embedUrls(content, [renderImageUrl, renderVideoUrl, renderGenericUrl]);

  return <Box whiteSpace="pre-wrap">{content}</Box>;
}

function Message({ event }: { event: NostrEvent } & Omit<CardProps, "children">) {
  const account = useCurrentAccount()!;
  const isOwnMessage = account.pubkey === event.pubkey;

  return (
    <Flex direction="column">
      <Text size="sm" textAlign={isOwnMessage ? "right" : "left"} px="2">
        {dayjs.unix(event.created_at).fromNow()}
      </Text>
      <Card size="sm" mr={isOwnMessage ? 0 : "8"} ml={isOwnMessage ? "8" : 0}>
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

function DirectMessageChatPage() {
  const { key } = useParams();
  if (!key) return <Navigate to="/" />;
  const pubkey = normalizeToHex(key);
  if (!pubkey) throw new Error("invalid pubkey");

  const { requestEncrypt, requestSignature } = useSigningContext();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(dayjs().subtract(1, "week"));
  const [content, setContent] = useState<string>("");

  useEffect(() => directMessagesService.loadDateRange(from), [from]);

  const loadMore = () => {
    setLoading(true);
    setFrom((date) => dayjs(date).subtract(1, "week"));
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const subject = useMemo(() => directMessagesService.getUserMessages(pubkey), [pubkey]);
  const messages = useSubject(subject);

  const sendMessage = async () => {
    if (!content) return;
    const encrypted = await requestEncrypt(content, pubkey);
    if (!encrypted) return;
    const event: DraftNostrEvent = {
      kind: Kind.EncryptedDirectMessage,
      content: encrypted,
      tags: [["p", pubkey]],
      created_at: dayjs().unix(),
    };
    const signed = await requestSignature(event);
    if (!signed) return;
    const writeRelays = clientRelaysService.getWriteUrls();
    nostrPostAction(writeRelays, signed);
    setContent("");
  };

  return (
    <Flex height="100%" overflow="hidden" direction="column">
      <Card size="sm" flexShrink={0}>
        <CardBody display="flex" gap="2" alignItems="center">
          <IconButton
            as={Link}
            variant="ghost"
            icon={<ArrowLeftSIcon />}
            aria-label="Back"
            to="/dm"
            size={isMobile ? "sm" : "md"}
          />
          <UserAvatar pubkey={pubkey} size={isMobile ? "sm" : "md"} />
          <UserLink pubkey={pubkey} />
        </CardBody>
      </Card>
      <Flex flex={1} overflowX="hidden" overflowY="scroll" direction="column" gap="4" py="4">
        <Spacer height="100vh" />
        <Button onClick={loadMore} mx="auto" flexShrink={0} isLoading={loading}>
          Load More
        </Button>
        {[...messages].reverse().map((event) => (
          <Message key={event.id} event={event} />
        ))}
      </Flex>
      <Flex shrink={0}>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
        <Button isDisabled={!content} onClick={sendMessage}>
          Send
        </Button>
      </Flex>
    </Flex>
  );
}
export default function DirectMessageChatView() {
  return (
    <RequireCurrentAccount>
      <DirectMessageChatPage />
    </RequireCurrentAccount>
  );
}
