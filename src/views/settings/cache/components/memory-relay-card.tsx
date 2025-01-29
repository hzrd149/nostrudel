import { useState } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import MemoryRelay from "../../../../classes/memory-relay";
import useCacheRelay from "../../../../hooks/use-cache-relay";
import { setCacheRelayURL } from "../../../../services/cache-relay";

export default function MemoryRelayCard() {
  const cacheRelay = useCacheRelay();
  const enabled = cacheRelay instanceof MemoryRelay;

  const [enabling, setEnabling] = useState(false);
  const enable = async () => {
    try {
      setEnabling(true);
      await setCacheRelayURL(":memory:");
    } catch (error) {}
    setEnabling(false);
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">In-memory Cache</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled} isLoading={enabling}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Stores all events in memory</Text>
        <Text>Maximum capacity: Unlimited, until your system freezes</Text>
        <Text>Performance: Very fast</Text>
        <Text color="yellow.500">NOTE: All events are forgotten when you close the app</Text>
      </CardBody>
      {enabled && (
        <CardFooter p="4" pt="0">
          <Button size="sm" colorScheme="primary" ml="auto" as={RouterLink} to="/relays/cache/database">
            Database Tools
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
