import { useMemo } from "react";
import { Emoji, getEmojis, getEventUID, getPackName } from "applesauce-core/helpers";
import { getAddressPointersFromList } from "applesauce-lists/helpers";

import EmojiPicker, { defaultCategories, NativeEmoji } from "./emoji-picker";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";
import useCurrentAccount from "../../hooks/use-current-account";

export default function ReactionPicker({
  autoFocus,
  onSelect,
}: {
  autoFocus?: boolean;
  onSelect?: (emoji: string | Emoji) => void;
}) {
  const account = useCurrentAccount();
  const favoritePacks = useFavoriteEmojiPacks(account?.pubkey);
  const packs = useReplaceableEvents(favoritePacks ? getAddressPointersFromList(favoritePacks) : []);
  const custom = useMemo(
    () =>
      packs.map((pack) => {
        const id = getEventUID(pack);
        const name = getPackName(pack) || "Unnamed";
        const emojis = getEmojis(pack);

        return {
          id,
          name,
          emojis: emojis.map((e) => ({
            id: e.name,
            name: e.name,
            keywords: [e.name, e.name.toUpperCase(), e.name.replaceAll("_", "")],
            skins: [{ src: e.url }],
          })),
        };
      }),
    [packs],
  );

  const categories = useMemo(() => [...packs.map((p) => getEventUID(p)), ...defaultCategories], [packs]);

  const handleSelect = (emoji: NativeEmoji) => {
    if (emoji.src) onSelect?.({ name: emoji.name, url: emoji.src });
    else if (emoji.id === "+1") onSelect?.("+");
    else if (emoji.id === "-1") onSelect?.("-");
    else if (emoji.native) onSelect?.(emoji.native);
  };

  return <EmojiPicker autoFocus={autoFocus} onEmojiSelect={handleSelect} custom={custom} categories={categories} />;
}
