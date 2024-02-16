import RelaySet from "../classes/relay-set";
import { RequestOptions } from "../services/replaceable-events";
import userMailboxesService from "../services/user-mailboxes";
import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useUserMailboxes(pubkey?: string, opts?: RequestOptions) {
  const readRelays = useReadRelays();
  const sub = pubkey ? userMailboxesService.requestMailboxes(pubkey, readRelays, opts) : undefined;
  const value = useSubject(sub);
  return value;
}
export function useUserInbox(pubkey?: string, opts?: RequestOptions) {
  return useUserMailboxes(pubkey, opts)?.inbox ?? new RelaySet();
}
export function useUserOutbox(pubkey?: string, opts?: RequestOptions) {
  return useUserMailboxes(pubkey, opts)?.outbox ?? new RelaySet();
}
