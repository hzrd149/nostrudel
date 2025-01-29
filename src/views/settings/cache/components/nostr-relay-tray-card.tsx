import { useAsync } from "react-use";
import { Button, Card, CardBody, CardHeader, Heading, Link, Text } from "@chakra-ui/react";

import { NOSTR_RELAY_TRAY_URL, checkNostrRelayTray, setCacheRelayURL } from "../../../../services/cache-relay";
import useCacheRelay from "../../../../hooks/use-cache-relay";
import { useState } from "react";

export default function NostrRelayTrayCard() {
  const cacheRelay = useCacheRelay();
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const enabled = cacheRelay?.url.startsWith(NOSTR_RELAY_TRAY_URL);

  const [enabling, setEnabling] = useState(false);
  const enable = async () => {
    try {
      setEnabling(true);
      await setCacheRelayURL(NOSTR_RELAY_TRAY_URL);
    } catch (error) {}
    setEnabling(false);
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Nostr Relay Tray</Heading>
        <Link color="blue.500" href="https://github.com/CodyTseng/nostr-relay-tray" isExternal>
          GitHub
        </Link>
        {available || enabled ? (
          <Button
            size="sm"
            colorScheme="primary"
            ml="auto"
            isLoading={checking || enabling}
            onClick={enable}
            isDisabled={enabled}
          >
            {enabled ? "Enabled" : "Enable"}
          </Button>
        ) : (
          <Button
            as={Link}
            isExternal
            href="https://github.com/CodyTseng/nostr-relay-tray/releases"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your systems tray</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your computer</Text>
        {!available && (
          <Text color="yellow.500">
            If the app is running and the button still says "Get the app" the browser is probably blocking access to the
            relay
          </Text>
        )}
      </CardBody>
    </Card>
  );
}
