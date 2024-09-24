import RelaySet from "../classes/relay-set";
import { COMMON_CONTACT_RELAY } from "../const";
import { RequestOptions } from "../services/replaceable-events";
import userMailboxesService from "../services/user-mailboxes";
import { useReadRelays } from "./use-client-relays";
import { queryStore } from "../services/event-store";
import { useObservable } from "./use-observable";

export default function useUserMailboxes(
  pubkey?: string,
  additionalRelays: Iterable<string> = [],
  opts?: RequestOptions,
) {
  const readRelays = useReadRelays([...additionalRelays, COMMON_CONTACT_RELAY]);
  if (pubkey) {
    userMailboxesService.requestMailboxes(pubkey, readRelays, opts);
  }

  const observable = pubkey ? queryStore.getMailboxes(pubkey) : undefined;
  return useObservable(observable);
}
export function useUserInbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.inboxes;
}
export function useUserOutbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.outboxes;
}
