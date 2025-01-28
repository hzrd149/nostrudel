import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";
import { useEventFactory } from "applesauce-react/hooks";
import { isAddressPointerInList } from "applesauce-core/helpers/lists";
import { removeCoordinateTag, addCoordinateTag } from "applesauce-factory/operations";

import useFavoriteFeeds, { FAVORITE_FEEDS_IDENTIFIER } from "../../hooks/use-favorite-feeds";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";

export default function DVMFeedFavoriteButton({
  pointer,
  ...props
}: { pointer: AddressPointer } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const { favorites } = useFavoriteFeeds();
  const isFavorite = !!favorites && isAddressPointerInList(favorites, pointer);
  const [loading, setLoading] = useState(false);

  const handleClick = useAsyncErrorHandler(async () => {
    const prev = favorites || {
      kind: kinds.Application,
      tags: [["d", FAVORITE_FEEDS_IDENTIFIER]],
    };

    setLoading(true);
    const draft = await factory.modifyList(prev, isFavorite ? removeCoordinateTag(pointer) : addCoordinateTag(pointer));
    await publish(isFavorite ? "Unfavorite feed" : "Favorite feed", draft);
    setLoading(false);
  }, [factory, favorites, pointer, publish, setLoading]);

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Favorite feed" : "Unfavorite feed"}
      onClick={handleClick}
      isLoading={loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
