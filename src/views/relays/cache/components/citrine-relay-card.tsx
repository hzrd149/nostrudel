import { useState } from "react";
import { useAsync } from "react-use";
import { Button, Card, CardBody, CardHeader, Heading, Link, Text } from "@chakra-ui/react";

import { NOSTR_RELAY_TRAY_URL, checkNostrRelayTray, setCacheRelayURL } from "../../../../services/cache-relay";
import useCacheRelay from "../../../../hooks/use-cache-relay";

export default function CitrineRelayCard() {
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const cacheRelay = useCacheRelay();
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
        <Heading size="md">Citrine</Heading>
        <Link color="blue.500" href="https://github.com/greenart7c3/Citrine" isExternal>
          GitHub
        </Link>
        {available ? (
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
            href="https://github.com/greenart7c3/Citrine"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your phone</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your phone</Text>
      </CardBody>
    </Card>
  );
}
