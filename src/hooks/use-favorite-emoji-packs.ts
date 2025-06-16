import { useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import useReplaceableEvent from "./use-replaceable-event";

export default function useFavoriteEmojiPacks(user?: string | ProfilePointer) {
  const account = useActiveAccount();
  const pointer = useMemo(() => {
    if (typeof user === "string") return { kind: kinds.UserEmojiList, pubkey: user };
    if (user) return { kind: kinds.UserEmojiList, pubkey: user.pubkey, relays: user.relays };
    else if (account) return { kind: kinds.UserEmojiList, pubkey: account.pubkey };
  }, [user]);

  const favoritePacks = useReplaceableEvent(pointer);

  return favoritePacks;
}
