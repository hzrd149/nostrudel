import { FavoriteRelaysModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";

export default function useFavoriteRelays(pubkey?: string) {
  const account = useActiveAccount();
  const key = pubkey || account?.pubkey;

  return useEventModel(FavoriteRelaysModel, key ? [key] : undefined);
}
