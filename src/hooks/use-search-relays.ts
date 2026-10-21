import { useActiveAccount, use$ } from "applesauce-react/hooks";

import { DEFAULT_SEARCH_RELAYS, LOCAL_RELAY_URL } from "../const";
import { eventCache$ } from "../services/event-cache";
import { useRelayInfo } from "./use-relay-info";
import useCastUser from "./use-cast-user";

export function useCacheRelaySupportsSearch(): boolean {
  const eventCache = use$(eventCache$);

  const { info } = useRelayInfo(eventCache?.type === "local-relay" ? LOCAL_RELAY_URL : undefined, true);
  return eventCache ? eventCache.type === "wasm-worker" || !!info?.supported_nips.includes(50) : false;
}

export default function useSearchRelays(): string[] {
  const account = useActiveAccount();
  const searchRelayList = use$(useCastUser(account?.pubkey)?.searchRelays$);

  return searchRelayList ? searchRelayList.relays : DEFAULT_SEARCH_RELAYS;
}
