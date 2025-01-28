import { useActiveAccount } from "applesauce-react/hooks";

import { DEFAULT_SEARCH_RELAYS } from "../const";
import { getRelaysFromList } from "../helpers/nostr/lists";
import useUserSearchRelayList from "./use-user-search-relay-list";

export default function useSearchRelays() {
  const account = useActiveAccount();
  const searchRelayList = useUserSearchRelayList(account?.pubkey);
  const searchRelays = searchRelayList ? getRelaysFromList(searchRelayList) : DEFAULT_SEARCH_RELAYS;

  return searchRelays;
}
