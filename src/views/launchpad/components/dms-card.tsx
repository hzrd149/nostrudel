import { useMemo, useState } from "react";
import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, LinkBox, Text } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import KeyboardShortcut from "../../../components/keyboard-shortcut";
import useCurrentAccount from "../../../hooks/use-current-account";
import { useDMTimeline } from "../../../providers/global/dm-timeline";
import useSubject from "../../../hooks/use-subject";
import {
  KnownConversation,
  groupIntoConversations,
  hasResponded,
  identifyConversation,
  sortConversationsByLastReceived,
} from "../../../helpers/nostr/dms";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatar from "../../../components/user/user-avatar";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import UserName from "../../../components/user/user-name";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import { nip19 } from "nostr-tools";
import { useDecryptionContainer, useDecryptionContext } from "../../../providers/global/dycryption-provider";
import Timestamp from "../../../components/timestamp";

function MessagePreview({ message, pubkey }: { message: NostrEvent; pubkey: string }) {
  const { plaintext } = useDecryptionContainer(pubkey, message.content);
  return <Text isTruncated>{plaintext || "<Encrypted>"}</Text>;
}

function Conversation({ conversation }: { conversation: KnownConversation }) {
  const lastReceived = conversation.messages.find((m) => m.pubkey === conversation.correspondent);

  return (
    <Flex gap="2" as={LinkBox} py="2" px="5">
      <UserAvatar pubkey={conversation.correspondent} />
      <Flex direction="column" overflow="hidden">
        <Flex gap="2">
          <HoverLinkOverlay as={RouterLink} to={`/dm/${nip19.npubEncode(conversation.correspondent)}`}>
            <UserName pubkey={conversation.correspondent} />
          </HoverLinkOverlay>
          <UserDnsIdentity pubkey={conversation.correspondent} onlyIcon />
        </Flex>
        {lastReceived && <MessagePreview message={lastReceived} pubkey={conversation.correspondent} />}
      </Flex>
      {lastReceived && <Timestamp timestamp={lastReceived.created_at} ml="auto" />}
    </Flex>
  );
}

export default function DMsCard({ ...props }: Omit<CardProps, "children">) {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const { getOrCreateContainer, addToQueue, startQueue } = useDecryptionContext();

  const timeline = useDMTimeline();

  const messages = useSubject(timeline.timeline);
  const conversations = useMemo(() => {
    const grouped = groupIntoConversations(messages)
      .map((c) => identifyConversation(c, account.pubkey))
      .filter((c) => {
        if (c.messages.some((m) => m.pubkey === c.correspondent)) return hasResponded(c);
        else return false;
      });
    const sorted = sortConversationsByLastReceived(grouped);
    return sorted;
  }, [messages, account.pubkey]);

  const [loading, setLoading] = useState(false);
  const decrypt = async () => {
    const promises = conversations
      .slice(0, 4)
      .map((conversation) => {
        const last = conversation.messages.find((m) => m.pubkey === conversation.correspondent);
        if (!last) return;

        const container = getOrCreateContainer(conversation.correspondent, last.content);
        if (container.plaintext.value === undefined) return addToQueue(container);
      })
      .filter(Boolean);

    startQueue();

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">
          <Link as={RouterLink} to="/dm">
            Messages
          </Link>
        </Heading>
        <Button variant="link" isLoading={loading} ml="auto" onClick={decrypt}>
          Decrypt
        </Button>
        <KeyboardShortcut letter="m" requireMeta onPress={() => navigate("/dm")} />
      </CardHeader>
      <CardBody overflow="hidden" pt="0" display="flex" flexDirection="column" px="0">
        {conversations.slice(0, 4).map((conversation) => (
          <Conversation key={conversation.pubkeys.join("-")} conversation={conversation} />
        ))}
      </CardBody>
    </Card>
  );
}
