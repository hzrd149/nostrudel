import { useMemo } from "react";
import { USER_MEDIA_SERVERS_KIND, getServersFromEvent } from "../helpers/nostr/blossom";
import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const readRelays = useReadRelays(additionalRelays);
  const sub = pubkey
    ? replaceableEventsService.requestEvent(readRelays, USER_MEDIA_SERVERS_KIND, pubkey, undefined, opts)
    : undefined;
  const event = useSubject(sub);
  const servers = useMemo(() => (event ? getServersFromEvent(event) : []), [event?.id]);

  return { event, servers };
}
