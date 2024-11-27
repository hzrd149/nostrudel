import { useAsync } from "react-use";
import { Button, Card, CardBody, CardHeader, Heading, Text } from "@chakra-ui/react";

import { localRelay } from "../../../../services/local-relay";

export default function SatelliteRelayCard() {
  const { value: relay } = useAsync(() => window.satellite!.getLocalRelay());
  const { value: enabled } = useAsync(async () => localRelay?.url === relay, [localRelay?.url, relay]);
  const enable = () => {
    if (relay) {
      localStorage.setItem("localRelay", relay);
      location.reload();
    }
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Satellite Relay</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Satellite desktop exposes a local caching relay that can be used to store you events</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your computer</Text>
      </CardBody>
    </Card>
  );
}
