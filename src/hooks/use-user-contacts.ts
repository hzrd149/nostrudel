import { useMemo } from "react";
import userContactsService from "../services/user-contacts";
import useSubject from "./use-subject";

export function useUserContacts(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const observable = useMemo(
    () => userContactsService.requestContacts(pubkey, additionalRelays, alwaysRequest),
    [pubkey, alwaysRequest]
  );
  const contacts = useSubject(observable) ?? undefined;

  return contacts;
}
