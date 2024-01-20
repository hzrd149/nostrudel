import { useMemo } from "react";

import userMailboxesService from "../services/user-mailboxes";
import useSubject from "./use-subject";
import { useReadRelayUrls } from "./use-client-relays";
import { RequestOptions } from "../services/replaceable-event-requester";
import { COMMON_CONTACT_RELAY } from "../const";
import RelaySet from "../classes/relay-set";

/** @deprecated */
export function useUserRelays(pubkey: string, additionalRelays: Iterable<string> = [], opts: RequestOptions = {}) {
  const readRelays = useReadRelayUrls([...additionalRelays, COMMON_CONTACT_RELAY]);
  const subject = useMemo(
    () => userMailboxesService.requestMailboxes(pubkey, readRelays, opts),
    [pubkey, readRelays.urls.join("|")],
  );
  const userRelays = useSubject(subject);

  return userRelays?.relays || new RelaySet();
}
