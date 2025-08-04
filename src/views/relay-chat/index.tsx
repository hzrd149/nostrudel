import { Card, Flex, IconButton, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";
import { useNavigate } from "react-router-dom";

import HoverLinkOverlay from "../../components/hover-link-overlay";
import { ChevronRightIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import RelayFavicon from "../../components/relay/relay-favicon";
import { RelayUrlInput } from "../../components/relay-url-input";
import RouterLink from "../../components/router-link";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { connections$ } from "../../services/pool";

function RelayCard({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);

  return (
    <Card as={LinkBox} display="flex" gap={2} alignItems="center" direction="row" p="4">
      <RelayFavicon relay={relay} size="md" showStatus />
      <Flex direction="column" flex={1}>
        <HoverLinkOverlay
          as={RouterLink}
          to={`/relay-chat/${encodeURIComponent(relay)}`}
          isTruncated
          fontWeight="bold"
          fontSize="md"
        >
          {relay}
        </HoverLinkOverlay>
        {info?.description && <Text isTruncated>{info?.description}</Text>}
      </Flex>
    </Card>
  );
}

export default function RelayChatHomeView() {
  const navigate = useNavigate();
  const connections = useObservableState(connections$) ?? {};

  // Filter out relays with error state
  const activeRelays = Object.entries(connections)
    .filter(([_, state]) => state !== "error")
    .map(([relay]) => relay)
    .sort();

  const connect = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const relay = data.get("relay");
    navigate(`/relay-chat/${encodeURIComponent(relay as string)}`);
  };

  return (
    <SimpleView title="Relay Chat" maxW="8xl" center>
      {/* @ts-expect-error */}
      <Flex as="form" onSubmit={connect} gap={2} maxW="4xl" mx="auto" w="full">
        <RelayUrlInput name="relay" placeholder="Search for a relay" size="lg" w="full" />
        <IconButton
          aria-label="Connect to a relay"
          icon={<ChevronRightIcon boxSize={7} />}
          title="Connect"
          size="lg"
          type="submit"
        />
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {activeRelays.map((relay) => (
          <RelayCard key={relay} relay={relay} />
        ))}
      </SimpleGrid>
    </SimpleView>
  );
}
