import { Button, ButtonProps, IconButton, IconButtonProps } from "@chakra-ui/react";
import { AddFavoriteRelay, RemoveFavoriteRelay } from "applesauce-actions/actions";
import { useActiveAccount } from "applesauce-react/hooks";
import { StarEmptyIcon, StarFullIcon } from "../../../../components/icons";
import useAsyncAction from "../../../../hooks/use-async-action";
import useFavoriteRelays from "../../../../hooks/use-favorite-relays";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import actions from "../../../../services/actions";

export function useRelayFavoriteActions(relay: string) {
  const account = useActiveAccount();
  const favorites = useFavoriteRelays(account?.pubkey);
  const publish = usePublishEvent();

  const isFavorite = !!favorites && favorites.includes(relay);

  const favorite = useAsyncAction(async () => {
    await actions.exec(AddFavoriteRelay, relay).forEach((e) => publish("Favorite relay", e));
  });

  const unfavorite = useAsyncAction(async () => {
    await actions.exec(RemoveFavoriteRelay, relay).forEach((e) => publish("Unfavorite relay", e));
  });

  return { favorite, unfavorite, isFavorite };
}

export function RelayFavoriteIconButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const { favorite, unfavorite, isFavorite } = useRelayFavoriteActions(relay);

  return (
    <IconButton
      {...props}
      icon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Unfavorite relay" : "Favorite relay"}
      onClick={isFavorite ? unfavorite.run : favorite.run}
      isLoading={favorite.loading || unfavorite.loading}
    />
  );
}

export function RelayFavoriteButton({
  relay,
  ...props
}: { relay: string } & Omit<ButtonProps, "children" | "aria-label" | "isLoading" | "onClick">) {
  const { favorite, unfavorite, isFavorite } = useRelayFavoriteActions(relay);

  return (
    <Button
      {...props}
      leftIcon={isFavorite ? <StarFullIcon /> : <StarEmptyIcon />}
      aria-label={isFavorite ? "Unfavorite relay" : "Favorite relay"}
      onClick={isFavorite ? unfavorite.run : favorite.run}
      isLoading={favorite.loading || unfavorite.loading}
    >
      {isFavorite ? "Unfavorite" : "Favorite"}
    </Button>
  );
}
