import { Box, Button, Card, CardBody, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { useSet } from "react-use";

import { useRelayInfo } from "../../../hooks/use-relay-info";
import RelayFavicon from "../../../components/relay/relay-favicon";
import { containerProps } from "./common";

function RelayButton({ url, selected, onClick }: { url: string; selected: boolean; onClick: () => void }) {
  const { info } = useRelayInfo(url);

  return (
    <Card
      variant="outline"
      size="sm"
      borderColor={selected ? "primary.500" : "gray.500"}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
    >
      <CardBody>
        <Flex gap="2" mb="2">
          <RelayFavicon relay={url} />
          <Box>
            <Heading size="sm">{info?.name}</Heading>
            <Text fontSize="sm">{url}</Text>
          </Box>
        </Flex>
        <Text>{info?.description}</Text>
      </CardBody>
    </Card>
  );
}

const recommendedRelays = [
  "wss://relay.damus.io",
  "wss://welcome.nostr.wine",
  "wss://nos.lol",
  "wss://purplerelay.com",
  "wss://nostr.bitcoiner.social",
  "wss://nostr-pub.wellorder.net",
];
const defaultRelaySelection = new Set(["wss://relay.damus.io", "wss://nos.lol", "wss://welcome.nostr.wine"]);

export default function RelayStep({ onSubmit, onBack }: { onSubmit: (relays: string[]) => void; onBack: () => void }) {
  const [relays, relayActions] = useSet<string>(defaultRelaySelection);

  return (
    <Flex gap="4" {...containerProps} maxW="8in">
      <Heading size="lg" mb="2">
        Select some relays
      </Heading>

      <SimpleGrid columns={[1, 1, 2]} spacing="4">
        {recommendedRelays.map((url) => (
          <RelayButton key={url} url={url} selected={relays.has(url)} onClick={() => relayActions.toggle(url)} />
        ))}
      </SimpleGrid>

      {relays.size === 0 && <Text color="orange">You must select at least one relay</Text>}
      <Button
        w="full"
        colorScheme="primary"
        maxW="sm"
        isDisabled={relays.size === 0}
        onClick={() => onSubmit(Array.from(relays))}
        autoFocus
      >
        Next
      </Button>
      <Button w="full" variant="link" onClick={onBack}>
        Back
      </Button>
    </Flex>
  );
}
