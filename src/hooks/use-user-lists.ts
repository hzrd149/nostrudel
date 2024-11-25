import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";

import { SET_KINDS, isJunkList } from "../helpers/nostr/lists";
import { useReadRelays } from "./use-client-relays";
import userSetsService from "../services/user-sets";

export default function useUserSets(pubkey?: string, additionalRelays?: Iterable<string>, alwaysRequest?: boolean) {
  const readRelays = useReadRelays(additionalRelays);

  useEffect(() => {
    if (pubkey) userSetsService.requestSets(pubkey, readRelays, alwaysRequest);
  }, [pubkey, readRelays.urls.join("|"), alwaysRequest]);

  return (
    useStoreQuery(
      TimelineQuery,
      pubkey
        ? [
            {
              authors: [pubkey],
              kinds: SET_KINDS,
            },
          ]
        : undefined,
    )?.filter((e) => !isJunkList(e)) ?? []
  );
}
