import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { Stream } from "applesauce-common/casts";
import { EventFactory } from "applesauce-core/factories";
import { getAddressPointerForEvent } from "applesauce-core/helpers";
import { TagOperations } from "applesauce-core/operations";
import { kinds } from "nostr-tools";

import { StarEmptyIcon, StarFullIcon } from "../../../components/icons";
import { isEventInList } from "../../../helpers/nostr/lists";
import useAsyncAction from "../../../hooks/use-async-action";
import useFavoriteStreams, { FAVORITE_STREAMS_IDENTIFIER } from "../../../hooks/use-favorite-streams";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function StreamFavoriteButton({
  stream,
  ...props
}: { stream: Stream } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { favorites } = useFavoriteStreams();
  const address = getAddressPointerForEvent(stream.event);
  const isFavorite = !!favorites && isEventInList(favorites, stream.event);

  const click = useAsyncAction(async () => {
    if (!address) return; // v5: getAddressPointerForEvent can return null
    const operation = isFavorite
      ? TagOperations.removeAddressPointerTag(address)
      : TagOperations.addAddressPointerTag(address);
    const draft = await (favorites
      ? EventFactory.fromEvent(favorites).modifyPublicTags(operation)
      : EventFactory.fromKind(kinds.Application).modifyPublicTags(
          TagOperations.addNameValueTag(["d", FAVORITE_STREAMS_IDENTIFIER]),
          operation,
        ));

    await publish(isFavorite ? "Unfavorite stream" : "Favorite stream", draft);
  }, [isFavorite, address, favorites, publish]);

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
