import { Kind } from "nostr-tools";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserContactList(pubkey?: string, additionalRelays: string[] = [], alwaysRequest = true) {
  return useReplaceableEvent(pubkey && { kind: Kind.Contacts, pubkey }, additionalRelays, alwaysRequest);
}
