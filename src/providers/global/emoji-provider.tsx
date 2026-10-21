import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { Emoji } from "applesauce-common/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";

import useCastUser from "../../hooks/use-cast-user";

const EmojiContext = createContext<Emoji[]>([]);

export function useContextEmojis() {
  return useContext(EmojiContext);
}

export function UserEmojiProvider({ children, pubkey }: PropsWithChildren & { pubkey?: string }) {
  const account = useActiveAccount();
  const user = useCastUser(pubkey || account?.pubkey);

  const favoritePacks = use$(user?.favoriteEmojis$.packs$);
  const emojis = useMemo(() => favoritePacks?.flatMap((pack) => pack.emojis) ?? [], [favoritePacks]);

  return <EmojiProvider emojis={emojis}>{children}</EmojiProvider>;
}

export default function EmojiProvider({ children, emojis }: PropsWithChildren & { emojis: Emoji[] }) {
  const parent = useContext(EmojiContext);

  return <EmojiContext.Provider value={[...parent, ...emojis]}>{children}</EmojiContext.Provider>;
}
