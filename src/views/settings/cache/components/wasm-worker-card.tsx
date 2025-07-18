import { Button, Card, CardBody, CardFooter, CardHeader, Heading, Link, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useObservableEagerState } from "applesauce-react/hooks";
import { eventCache$, changeEventCache } from "../../../../services/event-cache";
import EnableWithDelete from "./enable-with-delete";
import useAsyncAction from "../../../../hooks/use-async-action";

export default function WasmWorkerCard() {
  const eventCache = useObservableEagerState(eventCache$);
  const enabled = eventCache?.type === "wasm-worker";
  const enable = useAsyncAction(async () => {
    await changeEventCache("wasm-worker");
  });

  const clear = async () => {
    if (eventCache?.type === "wasm-worker") {
      await eventCache.clear?.();
    } else {
      // import and delete database
      console.log("Importing worker to wipe database");
      const { default: worker } = await import("../../../../services/event-cache/wasm-worker");
      await worker.clear?.();
    }
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Internal SQLite Cache</Heading>
        <EnableWithDelete
          size="sm"
          ml="auto"
          enable={enable.run}
          enabled={enabled}
          wipe={clear}
          isLoading={enable.loading}
        />
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
