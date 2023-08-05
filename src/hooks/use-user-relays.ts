import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const relays = useReadRelayUrls(additionalRelays);
  const subject = useMemo(
    () => userRelaysService.requestRelays(pubkey, relays, alwaysRequest),
    [pubkey, relays.join("|"), alwaysRequest]
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays ?? [];
}
