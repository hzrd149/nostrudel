import { kinds } from "nostr-tools";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserContactList(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  return useReplaceableEvent(pubkey && { kind: kinds.Contacts, pubkey }, additionalRelays, force);
}
