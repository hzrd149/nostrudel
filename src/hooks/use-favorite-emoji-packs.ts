import useReplaceableEvent from "./use-replaceable-event";
import useCurrentAccount from "./use-current-account";
import { USER_EMOJI_LIST_KIND } from "../helpers/nostr/emoji-packs";
import { RequestOptions } from "../services/replaceable-event-requester";

export const FAVORITE_LISTS_IDENTIFIER = "nostrudel-favorite-lists";

export default function useFavoriteEmojiPacks(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const account = useCurrentAccount();
  const key = pubkey || account?.pubkey;
  const favoritePacks = useReplaceableEvent(
    key ? { kind: USER_EMOJI_LIST_KIND, pubkey: key } : undefined,
    additionalRelays,
    opts,
  );

  return favoritePacks;
}
