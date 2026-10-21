import { useMemo } from "react";
import { Emoji } from "applesauce-common/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";

import EmojiPicker, { defaultCategories, NativeEmoji } from "./emoji-picker";
import useCastUser from "../../hooks/use-cast-user";

export default function ReactionPicker({
  autoFocus,
  onSelect,
}: {
  autoFocus?: boolean;
  onSelect?: (emoji: string | Emoji) => void;
}) {
  const account = useActiveAccount();
  const favoritePacks = use$(useCastUser(account?.pubkey)?.favoriteEmojis$.packs$);
  const packs = useMemo(() => favoritePacks ?? [], [favoritePacks]);
  const custom = useMemo(
    () =>
      packs.map((pack) => ({
        id: pack.uid,
        name: pack.name || "Unnamed",
        emojis: pack.emojis.map((e) => ({
          id: e.shortcode,
          name: e.shortcode,
          keywords: [e.shortcode, e.shortcode.toUpperCase(), e.shortcode.replaceAll("_", "")],
          skins: [{ src: e.url }],
        })),
      })),
    [packs],
  );

  const categories = useMemo(() => [...packs.map((p) => p.uid), ...defaultCategories], [packs]);

  const handleSelect = (emoji: NativeEmoji) => {
    if (emoji.src) onSelect?.({ shortcode: emoji.name, url: emoji.src });
    else if (emoji.id === "+1") onSelect?.("+");
    else if (emoji.id === "-1") onSelect?.("-");
    else if (emoji.native) onSelect?.(emoji.native);
  };

  return <EmojiPicker autoFocus={autoFocus} onEmojiSelect={handleSelect} custom={custom} categories={categories} />;
}
