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
import useFavoriteLists, { FAVORITE_LISTS_IDENTIFIER } from "../../../hooks/use-favorite-lists";
import {
  NOTE_LIST_KIND,
  isSpecialListKind,
  listAddCoordinate,
  listRemoveCoordinate,
} from "../../../helpers/nostr/lists";

export default function ListFavoriteButton({
  list,
  ...props
}: { list: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const { list: favoriteList } = useFavoriteLists();
  const coordinate = getEventCoordinate(list);
  const isFavorite = favoriteList?.tags.some((t) => t[1] === coordinate);
  const [loading, setLoading] = useState(false);

  if (isSpecialListKind(list.kind)) return null;

  // NOTE: dont show favorite button for note lists
  if (list.kind === NOTE_LIST_KIND) return null;

  const handleClick = async () => {
    const prev: DraftNostrEvent = favoriteList || {
      kind: 30078,
      created_at: dayjs().unix(),
      content: "",
      tags: [["d", FAVORITE_LISTS_IDENTIFIER]],
    };

    try {
      setLoading(true);
      const draft = isFavorite ? listRemoveCoordinate(prev, coordinate) : listAddCoordinate(prev, coordinate);
      const signed = await requestSignature(draft);
      const pub = new NostrPublishAction("Favorite list", clientRelaysService.getWriteUrls(), signed);
      replaceableEventLoaderService.handleEvent(signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Favorite list" : "Unfavorite list"}
      onClick={handleClick}
      isLoading={loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
