import { useMemo } from "react";
import { unique } from "../helpers/array";
import userRelaysService from "../services/user-relays";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const clientRelays = useReadRelayUrls();
  const relays = useMemo(() => unique(clientRelays.concat(additionalRelays)), [additionalRelays.join(",")]);

  const observable = useMemo(
    () => userRelaysService.requestRelays(pubkey, relays, alwaysRequest),
    [pubkey, relays, alwaysRequest]
  );
  const contacts = useSubject(observable);

  return contacts;
}
