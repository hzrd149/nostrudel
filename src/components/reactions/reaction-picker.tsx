import { useMemo } from "react";
import { Emoji, getEmojis, getEventUID, getPackName } from "applesauce-core/helpers";
import { getAddressPointersFromList } from "applesauce-core/helpers/lists";
import { useActiveAccount } from "applesauce-react/hooks";

import EmojiPicker, { defaultCategories, NativeEmoji } from "./emoji-picker";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";

export default function ReactionPicker({
  autoFocus,
  onSelect,
}: {
  autoFocus?: boolean;
  onSelect?: (emoji: string | Emoji) => void;
}) {
  const account = useActiveAccount();
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
            id: e.shortcode,
            name: e.shortcode,
            keywords: [e.shortcode, e.shortcode.toUpperCase(), e.shortcode.replaceAll("_", "")],
            skins: [{ src: e.url }],
          })),
        };
      }),
    [packs],
  );

  const categories = useMemo(() => [...packs.map((p) => getEventUID(p)), ...defaultCategories], [packs]);

  const handleSelect = (emoji: NativeEmoji) => {
    if (emoji.src) onSelect?.({ shortcode: emoji.name, url: emoji.src });
    else if (emoji.id === "+1") onSelect?.("+");
    else if (emoji.id === "-1") onSelect?.("-");
    else if (emoji.native) onSelect?.(emoji.native);
  };

  return <EmojiPicker autoFocus={autoFocus} onEmojiSelect={handleSelect} custom={custom} categories={categories} />;
}
