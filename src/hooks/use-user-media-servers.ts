import { useMemo } from "react";
import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";
import { USER_BLOSSOM_SERVER_LIST_KIND, getServersFromServerListEvent } from "blossom-client-sdk";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const readRelays = useReadRelays(additionalRelays);
  const sub = pubkey
    ? replaceableEventsService.requestEvent(readRelays, USER_BLOSSOM_SERVER_LIST_KIND, pubkey, undefined, opts)
    : undefined;
  const event = useSubject(sub);
  const servers = useMemo(() => (event ? getServersFromServerListEvent(event) : []), [event?.id]);

  return { event, servers };
}
