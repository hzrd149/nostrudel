import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";

import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import useFavoriteLists, { FAVORITE_LISTS_IDENTIFIER } from "../../../hooks/use-favorite-lists";
import { isSpecialListKind, listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { unixNow } from "applesauce-core/helpers";

export default function ListFavoriteButton({
  list,
  ...props
}: { list: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { list: favoriteList } = useFavoriteLists();
  const coordinate = getEventCoordinate(list);
  const isFavorite = favoriteList?.tags.some((t) => t[1] === coordinate);
  const [loading, setLoading] = useState(false);

  if (isSpecialListKind(list.kind)) return null;

  // NOTE: don't show favorite button for note lists
  if (list.kind === kinds.Genericlists) return null;

  const handleClick = async () => {
    const prev: EventTemplate = favoriteList || {
      kind: kinds.Application,
      created_at: unixNow(),
      content: "",
      tags: [["d", FAVORITE_LISTS_IDENTIFIER]],
    };

    setLoading(true);
    const draft = isFavorite ? listRemoveCoordinate(prev, coordinate) : listAddCoordinate(prev, coordinate);
    await publish("Favorite list", draft);
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
