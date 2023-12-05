import { useState } from "react";
import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import replaceableEventLoaderService from "../../../services/replaceable-event-requester";
import { USER_EMOJI_LIST_KIND } from "../../../helpers/nostr/emoji-packs";
import useFavoriteEmojiPacks from "../../../hooks/use-favorite-emoji-packs";
import { listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";

export default function EmojiPackFavoriteButton({
  pack,
  ...props
}: { pack: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
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

    try {
      setLoading(true);
      const draft = isFavorite ? listRemoveCoordinate(prev, coordinate) : listAddCoordinate(prev, coordinate);
      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction(
        isFavorite ? "Unfavorite Emoji pack" : "Favorite emoji pack",
        clientRelaysService.getWriteUrls(),
        signed,
      );
      replaceableEventLoaderService.handleEvent(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
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
