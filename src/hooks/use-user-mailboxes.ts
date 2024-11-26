import { useStoreQuery } from "applesauce-react/hooks";
import { MailboxesQuery } from "applesauce-core/queries";
import { kinds } from "nostr-tools";

import { COMMON_CONTACT_RELAYS } from "../const";
import { RequestOptions } from "../services/replaceable-events";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMailboxes(
  pubkey?: string,
  additionalRelays: Iterable<string> = [],
  opts?: RequestOptions,
) {
  useReplaceableEvent(
    pubkey && { kind: kinds.RelayList, pubkey },
    additionalRelays ? [...additionalRelays, ...COMMON_CONTACT_RELAYS] : COMMON_CONTACT_RELAYS,
    opts,
  );

  return useStoreQuery(MailboxesQuery, pubkey ? [pubkey] : undefined);
}

export function useUserInbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.inboxes;
}
export function useUserOutbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.outboxes;
}
