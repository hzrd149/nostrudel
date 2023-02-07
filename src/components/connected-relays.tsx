import { useState } from "react";
import { Text } from "@chakra-ui/react";
import { useInterval } from "react-use";
import { Relay } from "../services/relays";
import relayPool from "../services/relays/relay-pool";

export const ConnectedRelays = () => {
  const [relays, setRelays] = useState<Relay[]>(relayPool.getRelays());

  useInterval(() => {
    setRelays(relayPool.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);
  const disconnected = relays.filter((relay) => !relay.okay);

  return (
    <Text textAlign="center">
      {connected.length}/{relays.length} of relays connected
    </Text>
  );
};
