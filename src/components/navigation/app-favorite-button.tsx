import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { EventFactory } from "applesauce-core/factories";
import { NameValueTag } from "applesauce-core/helpers";
import { TagOperations } from "applesauce-core/operations";

import { App, defaultUserFavoriteApps } from "./apps";
import useFavoriteInternalIds from "../../hooks/use-favorite-internal-ids";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";

export default function AppFavoriteButton({
  app,
  ...props
}: { app: App } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { favorites } = useFavoriteInternalIds("apps", "app");
  const isFavorite = favorites?.tags.some((t) => t[0] === "app" && t[1] === app.id);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const tag: NameValueTag = ["app", app.id];
    const operation = isFavorite ? TagOperations.removeNameValueTag(tag) : TagOperations.addNameValueTag(tag);
    const draft = await (favorites
      ? EventFactory.fromEvent(favorites).modifyPublicTags(operation)
      : EventFactory.fromKind(kinds.Application).modifyPublicTags(
          TagOperations.addNameValueTag(["d", "nostrudel-favorite-apps"]),
          ...defaultUserFavoriteApps.map((id) => TagOperations.addNameValueTag(["app", id] as NameValueTag)),
          operation,
        ));
    await publish(isFavorite ? "Unfavorite app" : "Favorite app", draft);
    setLoading(false);
  };

  return (
    <IconButton
      icon={isFavorite ? <StarFullIcon boxSize="1.1em" /> : <StarEmptyIcon boxSize="1.1em" />}
      aria-label={isFavorite ? "Unfavorite app" : "Favorite app"}
      title={isFavorite ? "Unfavorite app" : "Favorite app"}
      onClick={handleClick}
      isLoading={loading}
      color={isFavorite ? "yellow.400" : undefined}
      {...props}
    />
  );
}
