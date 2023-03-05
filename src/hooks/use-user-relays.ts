import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const readRelays = useReadRelayUrls(additionalRelays);

  const observable = useMemo(
    () => userRelaysService.requestRelays(pubkey, readRelays, alwaysRequest),
    [pubkey, readRelays.join("|"), alwaysRequest]
  );
  const userRelays = useSubject(observable);

  return userRelays;
}
