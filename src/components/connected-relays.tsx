import { useState } from "react";
import { Text } from "@chakra-ui/react";
import { Relay } from "../services/relays";
import relayPool from "../services/relays/relay-pool";
import { useInterval } from "react-use";

export const ConnectedRelays = () => {
  const [relays, setRelays] = useState<Relay[]>(relayPool.getRelays());

  useInterval(() => {
    setRelays(relayPool.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);
  const disconnected = relays.filter((relay) => !relay.okay);

  return (
    <Text textAlign="center" variant="link">
      {connected.length}/{relays.length} of relays connected
    </Text>
  );
};
