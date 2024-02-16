import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { USER_EMOJI_LIST_KIND } from "../../../helpers/nostr/emoji-packs";
import useFavoriteEmojiPacks from "../../../hooks/use-favorite-emoji-packs";
import { listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function EmojiPackFavoriteButton({
  pack,
  ...props
}: { pack: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const favoritePacks = useFavoriteEmojiPacks();
  const coordinate = getEventCoordinate(pack);
  const isFavorite = favoritePacks?.tags.some((t) => t[1] === coordinate);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const prev: DraftNostrEvent = favoritePacks || {
      kind: USER_EMOJI_LIST_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [],
    };

    setLoading(true);
    const draft = isFavorite ? listRemoveCoordinate(prev, coordinate) : listAddCoordinate(prev, coordinate);
    await publish(isFavorite ? "Unfavorite Emoji pack" : "Favorite emoji pack", draft);
    setLoading(false);
  };

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Unfavorite" : "Favorite"}
      title={isFavorite ? "Unfavorite" : "Favorite"}
      onClick={handleClick}
      isLoading={loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
