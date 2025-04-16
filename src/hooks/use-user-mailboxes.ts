import { useStoreQuery } from "applesauce-react/hooks";
import { MailboxesQuery } from "applesauce-core/queries";
import { kinds } from "nostr-tools";

import { DEFAULT_LOOKUP_RELAYS } from "../const";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMailboxes(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  useReplaceableEvent(
    pubkey && { kind: kinds.RelayList, pubkey },
    additionalRelays ? [...additionalRelays, ...DEFAULT_LOOKUP_RELAYS] : DEFAULT_LOOKUP_RELAYS,
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
