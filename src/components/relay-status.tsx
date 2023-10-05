import { Badge, useForceUpdate } from "@chakra-ui/react";
import { useInterval } from "react-use";

import Relay from "../classes/relay";
import relayPoolService from "../services/relay-pool";

const getStatusText = (relay: Relay) => {
  if (relay.connecting) return "Connecting...";
  if (relay.connected) return "Connected";
  if (relay.closing) return "Disconnecting...";
  if (relay.closed) return "Disconnected";
  return "Unused";
};
const getStatusColor = (relay: Relay) => {
  if (relay.connecting) return "yellow";
  if (relay.connected) return "green";
  if (relay.closing) return "yellow";
  if (relay.closed) return "red";
  return "gray";
};

export const RelayStatus = ({ url }: { url: string }) => {
  const update = useForceUpdate();

  const relay = relayPoolService.requestRelay(url, false);

  useInterval(() => update(), 500);

  return <Badge colorScheme={getStatusColor(relay)}>{getStatusText(relay)}</Badge>;
};
