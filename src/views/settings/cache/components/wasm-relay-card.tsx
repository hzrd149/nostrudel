import { useState } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import WasmRelay from "../../../../services/wasm-relay";
import EnableWithDelete from "./enable-with-delete";
import useCacheRelay from "../../../../hooks/use-cache-relay";
import { setCacheRelayURL } from "../../../../services/cache-relay";

export default function WasmRelayCard() {
  const cacheRelay = useCacheRelay();
  const enabled = cacheRelay instanceof WasmRelay;
  const [enabling, setEnabling] = useState(false);
  const enable = async () => {
    try {
      setEnabling(true);
      await setCacheRelayURL("nostr-idb://wasm-worker");
    } catch (error) {}
    setEnabling(false);
  };

  const wipe = async () => {
    if (cacheRelay instanceof WasmRelay) {
      await cacheRelay.wipe();
    } else {
      // import and delete database
      console.log("Importing worker to wipe database");
      const { default: worker } = await import("../../../../services/wasm-relay/worker");
      await worker.wipe();
    }
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Internal SQLite Cache</Heading>
        <EnableWithDelete size="sm" ml="auto" enable={enable} enabled={enabled} wipe={wipe} isLoading={enabling} />
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">
          Use{" "}
          <Link
            href="https://git.v0l.io/Kieran/snort/src/branch/main/packages/worker-relay"
            isExternal
            color="blue.500"
          >
            @snort/worker-relay
          </Link>{" "}
          with SQLite running in the browser.
        </Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: Slightly slower than Browser Cache</Text>
        <Text color="yellow.500">NOTE: Can increase the initial load time of the app by ~2 seconds</Text>
        <Text color="yellow.500">NOTE: Does not work well with multiple tabs</Text>
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
