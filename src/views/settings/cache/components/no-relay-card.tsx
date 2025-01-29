import { Button, Card, CardBody, CardHeader, Heading, Text } from "@chakra-ui/react";
import useCacheRelay from "../../../../hooks/use-cache-relay";
import localSettings from "../../../../services/local-settings";
import { useState } from "react";
import { setCacheRelayURL } from "../../../../services/cache-relay";

export default function NoRelayCard() {
  const cacheRelay = useCacheRelay();
  const enabled = cacheRelay === null;

  const [enabling, setEnabling] = useState(false);
  const enable = async () => {
    try {
      setEnabling(true);
      await setCacheRelayURL(":none:");
    } catch (error) {}
    setEnabling(false);
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">No Cache</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled} isLoading={enabling}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">No local relay, nothing is cached</Text>
        <Text>Maximum capacity: 0</Text>
        <Text>Performance: As fast as the relays your connecting to</Text>
        <Text color="blue.500">NOTE: Profiles and Timelines are still cached in memory</Text>
      </CardBody>
    </Card>
  );
}
