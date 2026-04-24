import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { isAddressPointerInList } from "applesauce-common/helpers/lists";
import { EventFactory } from "applesauce-core/factories";
import { TagOperations } from "applesauce-core/operations";
import { kinds } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";

import useAsyncAction from "../../hooks/use-async-action";
import useFavoriteFeeds, { FAVORITE_FEEDS_IDENTIFIER } from "../../hooks/use-favorite-feeds";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";

export default function DVMFeedFavoriteButton({
  pointer,
  ...props
}: { pointer: AddressPointer } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { favorites } = useFavoriteFeeds();
  const isFavorite = !!favorites && isAddressPointerInList(favorites, pointer);

  const toggle = useAsyncAction(async () => {
    const operation = isFavorite ? TagOperations.removeAddressPointerTag(pointer) : TagOperations.addAddressPointerTag(pointer);
    const draft = await (favorites
      ? EventFactory.fromEvent(favorites).modifyPublicTags(operation)
      : EventFactory.fromKind(kinds.Application).modifyPublicTags(
          TagOperations.addNameValueTag(["d", FAVORITE_FEEDS_IDENTIFIER]),
          operation,
        ));
    await publish(isFavorite ? "Unfavorite feed" : "Favorite feed", draft);
  }, [favorites, isFavorite, pointer, publish]);

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
