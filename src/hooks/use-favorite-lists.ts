import useReplaceableEvent from "./use-replaceable-event";
import { useCurrentAccount } from "./use-current-account";
import { getCoordinatesFromList } from "../helpers/nostr/lists";
import useReplaceableEvents from "./use-replaceable-events";

export const FAVORITE_LISTS_IDENTIFIER = "nostrudel-favorite-lists";

export default function useFavoriteLists() {
  const account = useCurrentAccount();
  const favoriteList = useReplaceableEvent(
    account ? { kind: 30078, pubkey: account.pubkey, identifier: FAVORITE_LISTS_IDENTIFIER } : undefined,
  );

  const lists = useReplaceableEvents(favoriteList ? getCoordinatesFromList(favoriteList).map((a) => a.coordinate) : []);

  return { lists, list: favoriteList };
}
