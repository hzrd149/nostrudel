import { useStoreQuery } from "applesauce-react/hooks";
import { MailboxesQuery } from "applesauce-core/queries";
import { kinds } from "nostr-tools";

import { COMMON_CONTACT_RELAYS } from "../const";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMailboxes(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvent(
    pubkey && { kind: kinds.RelayList, pubkey },
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
    force,
  );

  return useStoreQuery(MailboxesQuery, pubkey ? [pubkey] : undefined);
}

export function useUserInbox(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  return useUserMailboxes(pubkey, additionalRelays, force)?.inboxes;
}
export function useUserOutbox(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  return useUserMailboxes(pubkey, additionalRelays, force)?.outboxes;
}
