import { kinds } from "nostr-tools";
import { getAddressPointersFromList } from "applesauce-lists/helpers/general";

import useReplaceableEvent from "./use-replaceable-event";
import useCurrentAccount from "./use-current-account";
import useReplaceableEvents from "./use-replaceable-events";

export const FAVORITE_LISTS_IDENTIFIER = "nostrudel-favorite-lists";

export default function useFavoriteLists(pubkey?: string) {
  const account = useCurrentAccount();
  const key = pubkey || account?.pubkey;

  const favoriteList = useReplaceableEvent(
    key ? { kind: kinds.Application, pubkey: key, identifier: FAVORITE_LISTS_IDENTIFIER } : undefined,
  );

  const lists = useReplaceableEvents(favoriteList ? getAddressPointersFromList(favoriteList) : []);

  return { lists, list: favoriteList };
}
