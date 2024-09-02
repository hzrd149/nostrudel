import useReplaceableEvent from "./use-replaceable-event";
import useCurrentAccount from "./use-current-account";
import { getCoordinatesFromList } from "../helpers/nostr/lists";
import useReplaceableEvents from "./use-replaceable-events";

export const FAVORITE_LISTS_IDENTIFIER = "nostrudel-favorite-lists";

export default function useFavoriteLists(pubkey?: string) {
  const account = useCurrentAccount();
  const key = pubkey || account?.pubkey;

  const favoriteList = useReplaceableEvent(
    key ? { kind: 30078, pubkey: key, identifier: FAVORITE_LISTS_IDENTIFIER } : undefined,
  );

  const lists = useReplaceableEvents(favoriteList ? getCoordinatesFromList(favoriteList).map((a) => a.coordinate) : []);

  return { lists, list: favoriteList };
}
