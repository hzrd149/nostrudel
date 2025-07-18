import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";

import { DEFAULT_SEARCH_RELAYS, LOCAL_RELAY_URL } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import { eventCache$ } from "../services/event-cache";
import { useRelayInfo } from "./use-relay-info";
import useUserSearchRelayList from "./use-user-search-relay-list";

export function useCacheRelaySupportsSearch(): boolean {
  const eventCache = useObservableEagerState(eventCache$);

  const { info } = useRelayInfo(eventCache?.type === "local-relay" ? LOCAL_RELAY_URL : undefined, true);
  return eventCache ? eventCache.type === "wasm-worker" || !!info?.supported_nips.includes(50) : false;
}

export default function useSearchRelays(): string[] {
  const account = useActiveAccount();
  const searchRelayList = useUserSearchRelayList(account && { pubkey: account.pubkey });
  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : DEFAULT_SEARCH_RELAYS;

  return searchRelays;
}
