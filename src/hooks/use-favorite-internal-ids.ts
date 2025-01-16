import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import useCurrentAccount from "./use-current-account";

export default function useFavoriteInternalIds(identifier: string, tagName = "id", pubkey?: string) {
  const account = useCurrentAccount();
  pubkey = pubkey || account?.pubkey;

  const favorites = useReplaceableEvent(
    pubkey ? { kind: kinds.Application, pubkey, identifier: `nostrudel-favorite-${identifier}` } : undefined,
  );
  const ids = favorites?.tags.filter((t) => t[0] === tagName && t[1]).map((t) => t[1]);

  return { ids, favorites };
}
