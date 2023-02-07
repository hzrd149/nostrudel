import { useState } from "react";
import { Button, Text, useDisclosure } from "@chakra-ui/react";
import { useInterval } from "react-use";
import { Relay } from "../services/relays";
import relayPool from "../services/relays/relay-pool";
import { DevModel } from "./dev-modal";

export const ConnectedRelays = () => {
  const [relays, setRelays] = useState<Relay[]>(relayPool.getRelays());
  const { onOpen, onClose, isOpen } = useDisclosure();

  useInterval(() => {
    setRelays(relayPool.getRelays());
  }, 1000);

  const connected = relays.filter((relay) => relay.okay);
  const disconnected = relays.filter((relay) => !relay.okay);

  return (
    <>
      <Button textAlign="center" variant="link" onClick={onOpen}>
        {connected.length}/{relays.length} of relays connected
      </Button>
      {isOpen && <DevModel isOpen={isOpen} onClose={onClose} />}
    </>
  );
};
