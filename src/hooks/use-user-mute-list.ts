import { kinds } from "nostr-tools";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMuteList(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  return useReplaceableEvent(pubkey && { kind: kinds.Mutelist, pubkey }, additionalRelays, force);
}
