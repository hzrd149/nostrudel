import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { isAddressPointerInList } from "applesauce-core/helpers/lists";
import { addCoordinateTag, removeCoordinateTag } from "applesauce-factory/operations/tag";
import { useEventFactory } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";

import useAsyncAction from "../../hooks/use-async-action";
import useFavoriteFeeds, { FAVORITE_FEEDS_IDENTIFIER } from "../../hooks/use-favorite-feeds";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";
import { unixNow } from "applesauce-core/helpers";

export default function DVMFeedFavoriteButton({
  pointer,
  ...props
}: { pointer: AddressPointer } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const { favorites } = useFavoriteFeeds();
  const isFavorite = !!favorites && isAddressPointerInList(favorites, pointer);

  const toggle = useAsyncAction(async () => {
    const prev = favorites || {
      kind: kinds.Application,
      tags: [["d", FAVORITE_FEEDS_IDENTIFIER]],
      created_at: unixNow(),
      content: "",
    };

    const draft = await factory.modifyTags(prev, isFavorite ? removeCoordinateTag(pointer) : addCoordinateTag(pointer));
    await publish(isFavorite ? "Unfavorite feed" : "Favorite feed", draft);
  }, [factory, favorites, pointer, publish]);

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Favorite feed" : "Unfavorite feed"}
      onClick={toggle.run}
      isLoading={toggle.loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
