import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-event-requester";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const readRelays = useReadRelayUrls([...additionalRelays, "wss://purplepag.es"]);
  const subject = useMemo(
    () => userRelaysService.requestRelays(pubkey, readRelays, opts),
    [pubkey, readRelays.join("|")],
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays ?? [];
}
