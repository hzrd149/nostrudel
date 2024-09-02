import RelaySet from "../classes/relay-set";
import { COMMON_CONTACT_RELAY } from "../const";
import { RequestOptions } from "../services/replaceable-events";
import userMailboxesService from "../services/user-mailboxes";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useUserMailboxes(
  pubkey?: string,
  additionalRelays: Iterable<string> = [],
  opts?: RequestOptions,
) {
  const readRelays = useReadRelays([...additionalRelays, COMMON_CONTACT_RELAY]);
  const sub = pubkey ? userMailboxesService.requestMailboxes(pubkey, readRelays, opts) : undefined;
  const value = useSubject(sub);
  return value;
}
export function useUserInbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.inbox ?? new RelaySet();
}
export function useUserOutbox(pubkey?: string, additionalRelays: Iterable<string> = [], opts?: RequestOptions) {
  return useUserMailboxes(pubkey, additionalRelays, opts)?.outbox ?? new RelaySet();
}
