import { PropsWithChildren, createContext, useContext } from "react";
import { lib } from "emojilib";
import useUserEmojiPacks from "../hooks/use-users-emoji-packs";
import useReplaceableEvents from "../hooks/use-replaceable-events";
import { useCurrentAccount } from "../hooks/use-current-account";
import { isEmojiTag } from "../types/nostr-event";

const defaultEmojis = Object.entries(lib).map(([name, emojiObject]) => ({
  ...emojiObject,
  keywords: [name, ...emojiObject.keywords],
  name,
}));

export type Emoji = { name: string; keywords: string[]; char: string; url?: string };

const EmojiContext = createContext<Emoji[]>([]);

export function useContextEmojis() {
  return useContext(EmojiContext);
}

export function DefaultEmojiProvider({ children }: PropsWithChildren) {
  return <EmojiProvider emojis={defaultEmojis}>{children}</EmojiProvider>;
}

export function UserEmojiProvider({ children }: PropsWithChildren) {
  const account = useCurrentAccount();
  const userPacks = useUserEmojiPacks(account?.pubkey);
  const events = useReplaceableEvents(userPacks?.packs);

  const emojis = events
    .map((event) =>
      event.tags.filter(isEmojiTag).map((t) => ({ name: t[1], url: t[2], keywords: [t[1]], char: `:${t[1]}:` })),
    )
    .flat();

  console.log(userPacks, emojis);

  return <EmojiProvider emojis={emojis}>{children}</EmojiProvider>;
}

export default function EmojiProvider({ children, emojis }: PropsWithChildren & { emojis: Emoji[] }) {
  const parent = useContext(EmojiContext);

  return <EmojiContext.Provider value={[...parent, ...emojis]}>{children}</EmojiContext.Provider>;
}
