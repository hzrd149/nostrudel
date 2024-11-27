import { useAsync } from "react-use";
import { Button, Card, CardBody, CardHeader, Heading, Link, Text } from "@chakra-ui/react";

import { NOSTR_RELAY_TRAY_URL, checkNostrRelayTray, localRelay } from "../../../../services/local-relay";

export default function NostrRelayTrayCard() {
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const enabled = localRelay?.url.startsWith(NOSTR_RELAY_TRAY_URL);
  const enable = () => {
    localStorage.setItem("localRelay", NOSTR_RELAY_TRAY_URL);
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Nostr Relay Tray</Heading>
        <Link color="blue.500" href="https://github.com/CodyTseng/nostr-relay-tray" isExternal>
          GitHub
        </Link>
        {available || enabled ? (
          <Button size="sm" colorScheme="primary" ml="auto" isLoading={checking} onClick={enable} isDisabled={enabled}>
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
