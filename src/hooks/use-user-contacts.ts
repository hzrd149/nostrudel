import { useMemo } from "react";
import { unique } from "../helpers/array";
import userContactsService from "../services/user-contacts";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export function useUserContacts(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const clientRelays = useReadRelayUrls();
  const relays = useMemo(() => unique(clientRelays.concat(additionalRelays)), [additionalRelays.join(",")]);

  const observable = useMemo(
    () => userContactsService.requestContacts(pubkey, relays, alwaysRequest),
    [pubkey, relays, alwaysRequest]
  );
  const contacts = useSubject(observable) ?? undefined;

  return contacts;
}
