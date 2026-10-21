import { use$ } from "applesauce-react/hooks";
import { connectionState$ } from "../services/pool";

export default function useRelayConnectionState(relay: string) {
  return use$(() => connectionState$(relay), [relay]) ?? "dormant";
}
