import { kinds } from "nostr-tools";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvent from "./use-replaceable-event";

export default function useFavoriteEmojiPacks(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  const account = useActiveAccount();
  const key = pubkey || account?.pubkey;
  const favoritePacks = useReplaceableEvent(
    key ? { kind: kinds.UserEmojiList, pubkey: key } : undefined,
    additionalRelays,
    force,
  );

  return favoritePacks;
}
