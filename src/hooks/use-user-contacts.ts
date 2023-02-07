import { useMemo } from "react";
import settings from "../services/settings";
import userContacts from "../services/user-contacts";
import useSubject from "./use-subject";

export function useUserContacts(pubkey: string) {
  const relays = useSubject(settings.relays);
  const observable = useMemo(
    () => userContacts.requestUserContacts(pubkey, relays),
    [pubkey, relays]
  );
  const contacts = useSubject(observable) ?? undefined;

  return {
    loading: !contacts,
    contacts,
  };
}
