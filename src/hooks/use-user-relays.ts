import { useMemo } from "react";
import userRelaysService from "../services/user-relays";
import useSubject from "./use-subject";

export function useUserRelays(pubkey: string, additionalRelays: string[] = [], alwaysRequest = false) {
  const observable = useMemo(
    () => userRelaysService.requestRelays(pubkey, additionalRelays, alwaysRequest),
    [pubkey, alwaysRequest]
  );
  const contacts = useSubject(observable) ?? undefined;

  return contacts;
}
