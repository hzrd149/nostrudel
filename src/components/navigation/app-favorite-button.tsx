import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useEventFactory } from "applesauce-react/hooks";
import { NameValueTag, unixNow } from "applesauce-core/helpers";
import { removeNameValueTag, addNameValueTag } from "applesauce-factory/operations/tag";

import { App, defaultUserFavoriteApps } from "./apps";
import useFavoriteInternalIds from "../../hooks/use-favorite-internal-ids";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";

export default function AppFavoriteButton({
  app,
  ...props
}: { app: App } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const factory = useEventFactory();
  const { favorites } = useFavoriteInternalIds("apps", "app");
  const isFavorite = favorites?.tags.some((t) => t[0] === "app" && t[1] === app.id);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const prev = favorites || {
      kind: kinds.Application,
      tags: [["d", "nostrudel-favorite-apps"], ...defaultUserFavoriteApps.map((id) => ["app", id])],
      created_at: unixNow(),
      content: "",
    };

    setLoading(true);
    const tag: NameValueTag = ["app", app.id];
    const draft = await factory.modifyTags(prev, isFavorite ? removeNameValueTag(tag) : addNameValueTag(tag));
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
