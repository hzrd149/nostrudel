import replaceableEventsService, { RequestOptions } from "../services/replaceable-events";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useUsersMediaServers(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const readRelays = useReadRelays(additionalRelays);
  const sub = pubkey ? replaceableEventsService.requestEvent(readRelays, 10063, pubkey, undefined, opts) : undefined;
  const value = useSubject(sub);
  return value;
}
