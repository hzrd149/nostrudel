import { useObservableState } from "applesauce-react/hooks";
import { connections$ } from "../services/pool";

export default function useRelayConnectionState(relay: string) {
  const connections = useObservableState(connections$);
  return connections?.[relay] ?? "dormant";
}
