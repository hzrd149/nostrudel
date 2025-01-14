import { PropsWithChildren, createContext, useContext } from "react";
import { Emoji, getEmojis } from "applesauce-core/helpers";

import useReplaceableEvents from "../../hooks/use-replaceable-events";
import useCurrentAccount from "../../hooks/use-current-account";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import { getPackCordsFromFavorites } from "../../helpers/nostr/emoji-packs";

const EmojiContext = createContext<Emoji[]>([]);

export function useContextEmojis() {
  return useContext(EmojiContext);
}

export function UserEmojiProvider({ children, pubkey }: PropsWithChildren & { pubkey?: string }) {
  const account = useCurrentAccount();
  const favoriteList = useFavoriteEmojiPacks(pubkey || account?.pubkey, undefined, true);

  const favoritePacks = useReplaceableEvents(favoriteList && getPackCordsFromFavorites(favoriteList));
  const emojis = favoritePacks.map((pack) => getEmojis(pack)).flat();

  return <EmojiProvider emojis={emojis}>{children}</EmojiProvider>;
}

export default function EmojiProvider({ children, emojis }: PropsWithChildren & { emojis: Emoji[] }) {
  const parent = useContext(EmojiContext);

  return <EmojiContext.Provider value={[...parent, ...emojis]}>{children}</EmojiContext.Provider>;
}
