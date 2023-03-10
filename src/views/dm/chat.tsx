import { Button, Card, CardBody, CardProps, Flex, IconButton, Spacer, Text, Textarea } from "@chakra-ui/react";
import moment from "moment";
import { Kind } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { ArrowLeftSIcon } from "../../components/icons";
import { UserAvatar } from "../../components/user-avatar";
import { UserLink } from "../../components/user-link";
import { convertTimestampToDate } from "../../helpers/date";
import { normalizeToHex } from "../../helpers/nip19";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { useIsMobile } from "../../hooks/use-is-mobile";
import useSubject from "../../hooks/use-subject";
import { useSigningContext } from "../../providers/signing-provider";
import clientRelaysService from "../../services/client-relays";
import directMessagesService, { getMessageRecipient } from "../../services/direct-messages";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import DecryptPlaceholder from "./decrypt-placeholder";

function Message({ event }: { event: NostrEvent } & Omit<CardProps, "children">) {
  const account = useCurrentAccount();
  const isOwnMessage = account.pubkey === event.pubkey;

  return (
    <Flex direction="column">
      <Text size="sm" textAlign={isOwnMessage ? "right" : "left"} px="2">
        {moment(convertTimestampToDate(event.created_at)).fromNow()}
      </Text>
      <Card size="sm" mr={isOwnMessage ? 0 : "8"} ml={isOwnMessage ? "8" : 0}>
        <CardBody position="relative">
          <DecryptPlaceholder
            data={event.content}
            pubkey={isOwnMessage ? getMessageRecipient(event) ?? "" : event.pubkey}
          >
            {(text) => <Text whiteSpace="pre-wrap">{text}</Text>}
          </DecryptPlaceholder>
        </CardBody>
      </Card>
    </Flex>
  );
}

export default function DirectMessageChatView() {
  const { key } = useParams();
  if (!key) return <Navigate to="/" />;
  const pubkey = normalizeToHex(key);
  if (!pubkey) throw new Error("invalid pubkey");

  const { requestEncrypt, requestSignature } = useSigningContext();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(moment().subtract(1, "week"));
  const [content, setContent] = useState<string>("");

  useEffect(() => directMessagesService.loadDateRange(from), [from]);

  const loadMore = () => {
    setLoading(true);
    setFrom((date) => moment(date).subtract(1, "week"));
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
      created_at: moment().unix(),
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
