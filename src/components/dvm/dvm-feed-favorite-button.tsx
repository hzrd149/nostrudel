import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { modifyEventTags, unixNow } from "applesauce-core/helpers";
import { AddressPointer } from "nostr-tools/nip19";
import { Operations, isAddressPointerInList } from "applesauce-lists/helpers";

import useFavoriteFeeds, { FAVORITE_FEEDS_IDENTIFIER } from "../../hooks/use-favorite-feeds";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";
import { useSigningContext } from "../../providers/global/signing-provider";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";

export default function DVMFeedFavoriteButton({
  pointer,
  ...props
}: { pointer: AddressPointer } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { finalizeDraft } = useSigningContext();
  const { favorites } = useFavoriteFeeds();
  const isFavorite = !!favorites && isAddressPointerInList(favorites, pointer);
  const [loading, setLoading] = useState(false);

  const handleClick = useAsyncErrorHandler(async () => {
    const prev =
      favorites ||
      (await finalizeDraft({
        kind: kinds.Application,
        created_at: unixNow(),
        content: "",
        tags: [["d", FAVORITE_FEEDS_IDENTIFIER]],
      }));

    setLoading(true);
    const draft = await modifyEventTags(prev, {
      public: isFavorite ? Operations.removeCoordinateTag(pointer) : Operations.addCoordinateTag(pointer),
    });
    await publish(isFavorite ? "Unfavorite feed" : "Favorite feed", draft);
    setLoading(false);
  }, [finalizeDraft, favorites, pointer, publish, setLoading]);

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
