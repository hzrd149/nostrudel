import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Text } from "@chakra-ui/react";
import { CacheRelay, clearDB } from "nostr-idb";
import { Link as RouterLink } from "react-router-dom";

import { localDatabase, localRelay } from "../../../../services/local-relay";
import EnableWithDelete from "../components/enable-with-delete";

export default function InternalRelayCard() {
  const enabled = localRelay instanceof CacheRelay;
  const enable = () => {
    localStorage.setItem("localRelay", "nostr-idb://internal");
    location.reload();
  };

  const wipe = async () => {
    await clearDB(localDatabase);
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Browser Cache</Heading>
        <EnableWithDelete size="sm" ml="auto" enable={enable} enabled={enabled} wipe={wipe} />
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Use the browsers built-in database to cache events.</Text>
        <Text>Maximum capacity: 10k events</Text>
        <Text>Performance: Usable, but limited by the browser</Text>
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
