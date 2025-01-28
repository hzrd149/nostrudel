import { kinds } from "nostr-tools";
import { getAddressPointersFromList } from "applesauce-core/helpers/lists";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";
import useReplaceableEvents from "./use-replaceable-events";

export const FAVORITE_FEEDS_IDENTIFIER = "nostrudel-favorite-feeds";

export default function useFavoriteFeeds(pubkey?: string) {
  const account = useActiveAccount();
  const key = pubkey || account?.pubkey;

  const favorites = useReplaceableEvent(
    key ? { kind: kinds.Application, pubkey: key, identifier: FAVORITE_FEEDS_IDENTIFIER } : undefined,
  );

  const feeds = useReplaceableEvents(favorites ? getAddressPointersFromList(favorites) : []);

  return { feeds, favorites };
}
