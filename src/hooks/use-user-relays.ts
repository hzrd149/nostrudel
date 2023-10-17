import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-event-requester";
import { COMMON_CONTACT_RELAY } from "../const";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], opts: RequestOptions = {}) {
  const readRelays = useReadRelayUrls([...additionalRelays, COMMON_CONTACT_RELAY]);
  const subject = useMemo(
    () => userRelaysService.requestRelays(pubkey, readRelays, opts),
    [pubkey, readRelays.join("|")],
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays ?? [];
}
