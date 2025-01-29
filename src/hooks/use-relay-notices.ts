import { useObservable } from "applesauce-react/hooks";
import { notices$ } from "../services/rx-nostr";

export default function useRelayNotices(relay: string) {
  return useObservable(notices$).filter((n) => n.from === relay);
}
