import { useState } from "react";
import { NostrEvent } from "nostr-tools";
import { Button, ButtonGroup, Flex, Heading, SimpleGrid, Text, useForceUpdate, useInterval } from "@chakra-ui/react";

import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import NostrWebRTCPeer from "../../../../classes/nostr-webrtc-peer";
import WebRtcRelayClient from "../../../../classes/webrtc-relay-client";
import WebRtcRelayServer from "../../../../classes/webrtc-relay-server";
import { localRelay } from "../../../../services/local-relay";
import useCurrentAccount from "../../../../hooks/use-current-account";
import useUserContactList from "../../../../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../../../../helpers/nostr/lists";

export default function Connection({
  call,
  peer,
  client,
  server,
}: {
  call: NostrEvent;
  peer: NostrWebRTCPeer;
  client: WebRtcRelayClient;
  server: WebRtcRelayServer;
}) {
  const update = useForceUpdate();
  useInterval(update, 1000);
  // const toggleRead = () => {
  // if(clientRelaysService.readRelays.value.has(client))
  // };

  const account = useCurrentAccount();
  const contacts = useUserContactList(account?.pubkey);

  const [sending, setSending] = useState(false);
  const sendEvents = async () => {
    if (!account?.pubkey || !localRelay) return;

    setSending(true);
    const sub = localRelay.subscribe([{ authors: [account.pubkey] }], {
      onevent: (event) => {
        client.publish(event);
        update();
      },
      oneose: () => {
        sub.close();
        setSending(false);
      },
    });
  };

  const [requesting, setRequesting] = useState(false);
  const requestEvents = async () => {
    if (!contacts || !localRelay) return;

    setRequesting(true);
    const sub = client.subscribe([{ authors: getPubkeysFromList(contacts).map((p) => p.pubkey) }], {
      onevent: (event) => {
        if (localRelay) localRelay.publish(event);
        update();
      },
      oneose: () => {
        sub.close();
        setRequesting(false);
      },
    });
  };

  return (
    <Flex key={call.id} borderWidth="1px" rounded="md" p="2" gap="2" direction="column">
      <Flex gap="2" alignItems="center">
        <UserAvatar pubkey={call.pubkey} size="sm" />
        <UserName pubkey={call.pubkey} />
        <Text>{peer.connection?.connectionState ?? "Unknown"}</Text>
        <Button size="sm" ml="auto" colorScheme="red" isDisabled>
          Close
        </Button>
      </Flex>
      <Heading size="sm">Server:</Heading>
      <SimpleGrid spacing="2" columns={{ base: 2, md: 3, lg: 4, xl: 5 }}>
        <Text>Sent: {server.stats.events.sent}</Text>
        <Text>Received: {server.stats.events.received}</Text>
      </SimpleGrid>
      <Heading size="sm">Client:</Heading>
      <SimpleGrid spacing="2" columns={{ base: 2, md: 3, lg: 4, xl: 5 }}>
        <Text>Published: {client.stats.events.published}</Text>
        <Text>Received: {client.stats.events.received}</Text>
      </SimpleGrid>
      {account && (
        <ButtonGroup ml="auto" size="sm">
          <Button onClick={sendEvents} isLoading={sending}>
            Send events
          </Button>
          <Button onClick={requestEvents} isLoading={requesting}>
            Requests contacts
          </Button>
        </ButtonGroup>
      )}
    </Flex>
  );
}
