import { Button, Code, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useCallback } from "react";
import RelayName from "../../../../components/relay/relay-name";
import { liveness } from "../../../../services/pool";

export default function UnhealthyRelaysSettings() {
  const unhealthyRelays = useObservableEagerState(liveness.unhealthy$);

  return (
    <>
      <Heading size="md">Offline relays</Heading>
      <Text color="GrayText">
        Relays that failed to connect too many times are marked as <Code>dead</Code> and are automatically excluded from
        operations.
      </Text>

      <SimpleGrid columns={2} gap={2}>
        {unhealthyRelays.map((url) => (
          <DeadRelayControl key={url} url={url} />
        ))}
      </SimpleGrid>
    </>
  );
}

function DeadRelayControl({ url }: { url: string }) {
  const state = useObservableEagerState(liveness.state(url));
  const revive = useCallback(() => {
    liveness.revive(url);
  }, [url]);

  return (
    <Flex gap="2" pl="2">
      <Text isTruncated>
        <RelayName relay={url} />
        {state?.state === "dead" ? <Code ms="2">dead</Code> : null}
      </Text>
      {state?.state === "dead" && (
        <Button size="sm" colorScheme="orange" variant="link" onClick={revive} ms="auto">
          Revive
        </Button>
      )}
    </Flex>
  );
}
