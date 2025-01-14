import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";

export default function useUserSearchRelayList(pubkey?: string, additionalRelays?: Iterable<string>, force?: boolean) {
  return useReplaceableEvent(pubkey && { kind: kinds.SearchRelaysList, pubkey }, additionalRelays, force);
}
