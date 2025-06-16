import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";
import useAddressableEvent from "./use-addressable-event";

export default function useUserContactList(user?: string | ProfilePointer) {
  const pointer = useMemo(() => {
    if (typeof user === "string") return { kind: kinds.Contacts, pubkey: user };
    if (user) return { kind: kinds.Contacts, pubkey: user.pubkey, relays: user.relays };
  }, [user]);

  return useAddressableEvent(pointer);
}
