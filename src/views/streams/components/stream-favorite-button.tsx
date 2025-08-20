import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { getAddressPointerForEvent } from "applesauce-core/helpers";
import { addCoordinateTag, removeCoordinateTag } from "applesauce-factory/operations/tag";
import { useEventFactory } from "applesauce-react/hooks";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";

import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { isEventInList } from "../../../helpers/nostr/lists";
import useAsyncAction from "../../../hooks/use-async-action";
import useFavoriteStreams, { FAVORITE_STREAMS_IDENTIFIER } from "../../../hooks/use-favorite-streams";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { modifyPublicTags } from "applesauce-factory/operations/tags";

export default function StreamFavoriteButton({
  stream,
  ...props
}: { stream: NostrEvent } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const { favorites } = useFavoriteStreams();
  const address = getAddressPointerForEvent(stream);
  const isFavorite = !!favorites && isEventInList(favorites, stream);

  const click = useAsyncAction(async () => {
    const operation = isFavorite ? removeCoordinateTag(address) : addCoordinateTag(address);
    let draft: EventTemplate;
    if (favorites) {
      draft = await factory.modifyTags(favorites, operation);
    } else {
      draft = await factory.build(
        {
          kind: kinds.Application,
          tags: [["d", FAVORITE_STREAMS_IDENTIFIER]],
        },
        modifyPublicTags(operation),
      );
    }

    await publish(isFavorite ? "Unfavorite stream" : "Favorite stream", draft);
  }, [isFavorite, address, favorites, factory, publish]);

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon boxSize="1.1em" /> : <StarEmptyIcon boxSize="1.1em" />}
      aria-label={isFavorite ? "Unfavorite stream" : "Favorite stream"}
      title={isFavorite ? "Unfavorite stream" : "Favorite stream"}
      onClick={click.run}
      isLoading={click.loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
