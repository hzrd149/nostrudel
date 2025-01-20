import { useState } from "react";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { modifyEventTags, unixNow } from "applesauce-core/helpers";
import { Operations } from "applesauce-lists/helpers";

import { App, defaultFavoriteApps } from "./apps";
import useFavoriteInternalIds from "../../hooks/use-favorite-internal-ids";
import { useSigningContext } from "../../providers/global/signing-provider";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { StarEmptyIcon, StarFullIcon } from "../icons";

export default function AppFavoriteButton({
  app,
  ...props
}: { app: App } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const publish = usePublishEvent();
  const { finalizeDraft } = useSigningContext();
  const { favorites } = useFavoriteInternalIds("apps", "app");
  const isFavorite = favorites?.tags.some((t) => t[0] === "app" && t[1] === app.id);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const prev =
      favorites ||
      (await finalizeDraft({
        kind: kinds.Application,
        created_at: unixNow(),
        content: "",
        tags: [["d", "nostrudel-favorite-apps"], ...defaultFavoriteApps.map((id) => ["app", id])],
      }));

    setLoading(true);
    const tag = ["app", app.id];
    const draft = await modifyEventTags(prev, {
      public: isFavorite ? Operations.removeNameValueTag(tag) : Operations.addNameValueTag(tag),
    });
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
