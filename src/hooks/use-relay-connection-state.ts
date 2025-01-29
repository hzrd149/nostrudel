import { useObservable } from "applesauce-react/hooks";
import { connections$ } from "../services/rx-nostr";

export default function useRelayConnectionState(relay: string) {
  const connections = useObservable(connections$);
  return connections[relay];
}
