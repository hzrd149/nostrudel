import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const readRelays = useReadRelayUrls([...additionalRelays, "wss://purplepag.es"]);
  const subject = useMemo(
    () => userRelaysService.requestRelays(pubkey, readRelays, alwaysRequest),
    [pubkey, readRelays.join("|"), alwaysRequest],
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays ?? [];
}
