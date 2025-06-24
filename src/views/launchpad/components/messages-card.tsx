import { Button, Card, CardBody, CardHeader, CardProps, Flex, Heading, Link, LinkBox, Text } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { unlockLegacyMessage } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserName from "../../../components/user/user-name";
import {
  KnownConversation,
  groupIntoConversations,
  hasResponded,
  identifyConversation,
  sortConversationsByLastReceived,
} from "../../../helpers/nostr/dms";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import { useDirectMessagesTimeline } from "../../messages";

function MessagePreview({ message, pubkey }: { message: NostrEvent; pubkey: string }) {
  const { plaintext } = useLegacyMessagePlaintext(message);
  return <Text isTruncated>{plaintext || "<Encrypted>"}</Text>;
}

function Conversation({ conversation }: { conversation: KnownConversation }) {
  const lastReceived = conversation.messages.find((m) => m.pubkey === conversation.correspondent);

  return (
    <Flex gap="2" as={LinkBox} py="2" px="5">
      <UserAvatar pubkey={conversation.correspondent} />
      <Flex direction="column" overflow="hidden">
        <Flex gap="2">
          <HoverLinkOverlay as={RouterLink} to={`/messages/${nip19.npubEncode(conversation.correspondent)}`}>
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
  const account = useActiveAccount()!;

  const { timeline: messages } = useDirectMessagesTimeline(account.pubkey);

  const conversations = useMemo(() => {
    const grouped = groupIntoConversations(messages)
      .map((c) => identifyConversation(c, account.pubkey))
      .filter((c) => {
        if (c.messages.some((m) => m.pubkey === c.correspondent)) return !hasResponded(c);
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

        return unlockLegacyMessage(last, account.pubkey, account);
      })
      .filter(Boolean);

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  return (
    <Card variant="outline" {...props}>
      <CardHeader display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="lg">
          <Link as={RouterLink} to="/messages">
            Messages
          </Link>
        </Heading>
        <Button variant="link" isLoading={loading} ml="auto" onClick={decrypt}>
          Decrypt
        </Button>
      </CardHeader>
      <CardBody overflow="hidden" pt="0" display="flex" flexDirection="column" px="0">
        {conversations.slice(0, 4).map((conversation) => (
          <Conversation key={conversation.pubkeys.join("-")} conversation={conversation} />
        ))}
        <Button as={RouterLink} to="/messages" flexShrink={0} variant="link" size="lg" py="4">
          View More
        </Button>
      </CardBody>
    </Card>
  );
}
