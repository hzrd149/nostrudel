import { useMemo } from "react";
import { unique } from "../helpers/array";
import userContactsService from "../services/user-contacts";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserContacts(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const readRelays = useReadRelayUrls(additionalRelays);

  const observable = useMemo(
    () => userContactsService.requestContacts(pubkey, readRelays, alwaysRequest),
    [pubkey, readRelays, alwaysRequest]
  );
  const contacts = useSubject(observable);

  return contacts;
}
