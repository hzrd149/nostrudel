import { useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import useAddressableEvent from "./use-addressable-event";

export default function useFavoriteInternalIds(identifier: string, tagName = "id", pubkey?: string) {
  const account = useActiveAccount();
  pubkey = pubkey || account?.pubkey;

  const favorites = useAddressableEvent(
    pubkey ? { kind: kinds.Application, pubkey, identifier: `nostrudel-favorite-${identifier}` } : undefined,
  );
  const ids = favorites?.tags.filter((t) => t[0] === tagName && t[1]).map((t) => t[1]);

  return { ids, favorites };
}
