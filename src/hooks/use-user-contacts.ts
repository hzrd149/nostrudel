import { useMemo } from "react";
import userContactsService from "../services/user-contacts";
import useSubject from "./use-subject";

/** @deprecated */
export function useUserContacts(pubkey: string, relays: string[], alwaysRequest = false) {
  const observable = useMemo(
    () => userContactsService.requestContacts(pubkey, relays, alwaysRequest),
    [pubkey, relays.join("|"), alwaysRequest],
  );
  const contacts = useSubject(observable);

  return contacts;
}
