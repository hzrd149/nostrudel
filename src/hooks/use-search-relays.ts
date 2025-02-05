import { useActiveAccount } from "applesauce-react/hooks";

import { DEFAULT_SEARCH_RELAYS } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import useUserSearchRelayList from "./use-user-search-relay-list";
import useCacheRelay from "./use-cache-relay";
import { useRelayInfo } from "./use-relay-info";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import WasmRelay from "../services/wasm-relay";

export function useCacheRelaySupportsSearch() {
  const cacheRelay = useCacheRelay();
  const { info: cacheRelayInfo } = useRelayInfo(cacheRelay instanceof AbstractRelay ? cacheRelay : undefined, true);
  return (
    cacheRelay instanceof WasmRelay ||
    (cacheRelay instanceof AbstractRelay && !!cacheRelayInfo?.supported_nips?.includes(50))
  );
}

export default function useSearchRelays() {
  const account = useActiveAccount();
  const searchRelayList = useUserSearchRelayList(account?.pubkey);
  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : DEFAULT_SEARCH_RELAYS;

  return searchRelays;
}
