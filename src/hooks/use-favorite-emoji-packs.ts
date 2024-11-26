import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import useCurrentAccount from "./use-current-account";
import { RequestOptions } from "../services/replaceable-events";

export default function useFavoriteEmojiPacks(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const account = useCurrentAccount();
  const key = pubkey || account?.pubkey;
  const favoritePacks = useReplaceableEvent(
    key ? { kind: kinds.UserEmojiList, pubkey: key } : undefined,
    additionalRelays,
    opts,
  );

  return favoritePacks;
}
