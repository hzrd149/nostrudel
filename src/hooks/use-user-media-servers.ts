import { useMemo } from "react";
import { USER_BLOSSOM_SERVER_LIST_KIND, getServersFromServerListEvent } from "blossom-client-sdk";

import { RequestOptions } from "../services/replaceable-events";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const event = useReplaceableEvent(pubkey && { kind: USER_BLOSSOM_SERVER_LIST_KIND, pubkey }, additionalRelays, opts);
  const servers = useMemo(() => (event ? getServersFromServerListEvent(event) : []), [event?.id]);

  return { event, servers };
}
