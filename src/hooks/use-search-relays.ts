import { useActiveAccount } from "applesauce-react/hooks";

import { AbstractRelay } from "nostr-tools/abstract-relay";
import { DEFAULT_SEARCH_RELAYS } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import WasmRelay from "../services/wasm-relay";
import useCacheRelay from "./use-cache-relay";
import { useRelayInfo } from "./use-relay-info";
import useUserSearchRelayList from "./use-user-search-relay-list";

export function useCacheRelaySupportsSearch(): boolean {
  const cacheRelay = useCacheRelay();
  const { info: cacheRelayInfo } = useRelayInfo(cacheRelay instanceof AbstractRelay ? cacheRelay.url : undefined, true);
  return (
    cacheRelay instanceof WasmRelay ||
    (cacheRelay instanceof AbstractRelay && !!cacheRelayInfo?.supported_nips?.includes(50))
  );
}

export default function useSearchRelays(): string[] {
  const account = useActiveAccount();
  const searchRelayList = useUserSearchRelayList(account && { pubkey: account.pubkey });
  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : DEFAULT_SEARCH_RELAYS;

  return searchRelays;
}
