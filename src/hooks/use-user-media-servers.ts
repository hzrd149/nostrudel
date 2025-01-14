import { useMemo } from "react";
import { USER_BLOSSOM_SERVER_LIST_KIND, getServersFromServerListEvent } from "blossom-client-sdk";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], force?: boolean) {
  const event = useReplaceableEvent(pubkey && { kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey }, additionalRelays, force);
  const servers = useMemo(() => (event ? getServersFromServerListEvent(event) : []), [event?.id]);

  return { event, servers };
}
