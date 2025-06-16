import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import useAddressableEvent from "./use-addressable-event";

export default function useUserSearchRelayList(user?: ProfilePointer) {
  const pointer = useMemo(
    () => (user ? { kind: kinds.SearchRelaysList, pubkey: user.pubkey, relays: user.relays } : undefined),
    [user],
  );

  return useAddressableEvent(pointer);
}
