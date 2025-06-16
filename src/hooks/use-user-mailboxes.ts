import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { MailboxesQuery } from "../models/mailboxes";

export default function useUserMailboxes(user?: string | ProfilePointer) {
  return useEventModel(MailboxesQuery, user ? [user] : undefined);
}

export function useUserInbox(pubkey?: string) {
  return useUserMailboxes(pubkey)?.inboxes;
}
export function useUserOutbox(pubkey?: string) {
  return useUserMailboxes(pubkey)?.outboxes;
}
