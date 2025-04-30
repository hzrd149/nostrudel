import { useObservable } from "applesauce-react/hooks";
import { connections$ } from "../services/pool";

export default function useRelayConnectionState(relay: string) {
  const connections = useObservable(connections$);
  return connections?.[relay] ?? "dormant";
}
