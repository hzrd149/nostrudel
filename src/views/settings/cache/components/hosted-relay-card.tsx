import { Button, Card, CardBody, CardHeader, Heading, Text } from "@chakra-ui/react";

import { useObservableEagerState } from "applesauce-react/hooks";
import { eventCache$ } from "../../../../services/event-cache";
import localSettings from "../../../../services/preferences";

export default function HostedRelayCard() {
  const eventCache = useObservableEagerState(eventCache$);
  const enabled = eventCache?.type === "hosted-relay";
  const enable = () => {
    localSettings.eventCache.clear();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Hosted Relay</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Your installation of noStrudel is setup with a local relay that can be used as a cache</Text>
        <Text>Maximum capacity: Unknown</Text>
        <Text>Performance: Unknown, but probably fast...</Text>
      </CardBody>
    </Card>
  );
}
