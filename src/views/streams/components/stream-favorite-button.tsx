import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { modifyEventTags, unixNow } from "applesauce-core/helpers";
import { Operations } from "applesauce-lists/helpers";

import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import { isEventInList } from "../../../helpers/nostr/lists";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import useFavoriteStreams, { FAVORITE_STREAMS_IDENTIFIER } from "../../../hooks/use-favorite-streams";
import { useSigningContext } from "../../../providers/global/signing-provider";

export default function StreamFavoriteButton({
  stream,
  ...props
}: { stream: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { finalizeDraft } = useSigningContext();
  const { favorites } = useFavoriteStreams();
  const coordinate = getEventCoordinate(stream);
  const isFavorite = !!favorites && isEventInList(favorites, stream);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const prev =
      favorites ||
      (await finalizeDraft({
        kind: kinds.Application,
        created_at: unixNow(),
        content: "",
        tags: [["d", FAVORITE_STREAMS_IDENTIFIER]],
      }));

    setLoading(true);
    const draft = await modifyEventTags(prev, {
      public: isFavorite ? Operations.removeCoordinateTag(coordinate) : Operations.addCoordinateTag(coordinate),
    });
    await publish(isFavorite ? "Unfavorite stream" : "Favorite stream", draft);
    setLoading(false);
  };

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon boxSize="1.1em" /> : <StarEmptyIcon boxSize="1.1em" />}
      aria-label={isFavorite ? "Unfavorite stream" : "Favorite stream"}
      title={isFavorite ? "Unfavorite stream" : "Favorite stream"}
      onClick={handleClick}
      isLoading={loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
