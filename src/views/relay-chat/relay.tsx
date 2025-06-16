import { Alert, AlertIcon, Box, Divider, Flex, Text } from "@chakra-ui/react";
import { getSeenRelays, getTagValue } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import RelayStatusBadge from "../../components/relays/relay-status";
import Timestamp from "../../components/timestamp";
import UserLink from "../../components/user/user-link";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useSimpleSubscription from "../../hooks/use-forward-subscription";
import { getRelayChatSubscription, RELAY_CHAT_MESSAGE_KIND } from "../../services/relay-chats";
import RelayChatMessageContent from "./components/relay-chat-message-content";
import RelayChatMessageForm from "./components/relay-chat-message-form";

function RelayChatMessage({ message }: { message: NostrEvent }) {
  const color = `#${message.pubkey.slice(0, 6)}`;

  return (
    <Box borderLeftWidth={3} pl="2" borderLeftColor={color}>
      <Flex gap="2" float="left" me="2" fontFamily="mono">
        <UserLink pubkey={message.pubkey} fontWeight="bold" />
        <Timestamp timestamp={message.created_at} color="blue.500" />
      </Flex>
      <RelayChatMessageContent message={message} />
    </Box>
  );
}

function RelayChatLog({ relay, channel }: { relay: string; channel?: string }) {
  const clientMuteFilter = useClientSideMuteFilter();
  const messages =
    useEventModel(TimelineModel, [{ kinds: [RELAY_CHAT_MESSAGE_KIND] }])
      ?.filter((e) => getSeenRelays(e)?.has(relay) && (getTagValue(e, "d") ?? "_") === (channel ?? "_"))
      .filter((e) => !clientMuteFilter(e)) ?? [];

  return (
    <>
      {messages.map((message) => (
        <RelayChatMessage key={message.id} message={message} />
      ))}
    </>
  );
}

function RelayChatRelayPage({ relay }: { relay: string }) {
  const [channel, setChannel] = useState<string>();

  useSimpleSubscription([relay], [{ kinds: [RELAY_CHAT_MESSAGE_KIND] }]);

  // Keep a subscription to the relay open
  useEffect(() => {
    const sub = getRelayChatSubscription(relay).subscribe();
    return () => sub.unsubscribe();
  }, [relay]);

  return (
    <SimpleView title={"Chat: " + relay} scroll={false} flush actions={<RelayStatusBadge relay={relay} />}>
      <Flex direction="column-reverse" p="4" gap={2} flexGrow={1} h={0} overflowX="hidden" overflowY="auto">
        <RelayChatLog relay={relay} channel={channel} />
        <Flex gap="2" alignItems="center">
          <Divider />
          <Text whiteSpace="pre">Connected</Text>
          <Divider />
        </Flex>
        <Alert status="info">
          <AlertIcon />
          Relay chat messages are ephemeral and disappear after being sent, If there are not messages in this channel
          its because no one is talking.
        </Alert>
      </Flex>

      <RelayChatMessageForm px="2" relay={relay} channel={channel} />
    </SimpleView>
  );
}

export default function RelayChatRelayView() {
  const params = useParams();
  if (!params.relay) return <Navigate to="/relay-chat" />;

  return <RelayChatRelayPage relay={params.relay} />;
}
