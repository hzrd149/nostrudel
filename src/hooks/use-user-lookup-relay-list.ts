import { LOOKUP_RELAY_LIST_KIND } from "applesauce-common/helpers";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import useAddressableEvent from "./use-addressable-event";

/** Returns a user's NIP-51 lookup relay list event (kind 10086) */
export default function useUserLookupRelayList(user?: ProfilePointer) {
  const pointer = useMemo(
    () => (user ? { kind: LOOKUP_RELAY_LIST_KIND, pubkey: user.pubkey, relays: user.relays } : undefined),
    [user],
  );

  return useAddressableEvent(pointer);
}
