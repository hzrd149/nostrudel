import { USER_BLOSSOM_SERVER_LIST_KIND } from "blossom-client-sdk";

import { UserBlossomServersQuery } from "applesauce-core/queries";
import { useStoreQuery } from "applesauce-react/hooks";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], force?: boolean) {
  useReplaceableEvent(pubkey && { kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey }, additionalRelays, force);
  return useStoreQuery(UserBlossomServersQuery, pubkey ? [pubkey] : null);
}
