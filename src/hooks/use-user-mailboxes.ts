import RelaySet from "../classes/relay-set";
import { RequestOptions } from "../services/replaceable-event-requester";
import userMailboxesService from "../services/user-mailboxes";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";

export default function useUserMailboxes(pubkey: string, opts?: RequestOptions) {
  const readRelays = useReadRelayUrls();
  const sub = userMailboxesService.requestMailboxes(pubkey, readRelays, opts);
  const value = useSubject(sub);
  return value;
}
export function useUserInbox(pubkey: string, opts?: RequestOptions) {
  return useUserMailboxes(pubkey, opts)?.inbox ?? new RelaySet();
}
export function useUserOutbox(pubkey: string, opts?: RequestOptions) {
  return useUserMailboxes(pubkey, opts)?.outbox ?? new RelaySet();
}
