import { DEFAULT_SEARCH_RELAYS } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import useCurrentAccount from "./use-current-account";
import useUserSearchRelayList from "./use-user-search-relay-list";

export default function useSearchRelays() {
  const account = useCurrentAccount();
  const searchRelayList = useUserSearchRelayList(account?.pubkey);
  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : DEFAULT_SEARCH_RELAYS;

  // TODO: maybe add localRelay into the list if it supports NIP-50

  return searchRelays;
}
