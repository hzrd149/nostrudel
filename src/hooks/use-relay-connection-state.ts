import { use$ } from "applesauce-react/hooks";
import { connections$ } from "../services/pool";

export default function useRelayConnectionState(relay: string) {
  const connections = use$(connections$);
  return connections?.[relay] ?? "dormant";
}
