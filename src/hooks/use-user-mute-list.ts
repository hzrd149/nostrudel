import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";
import useReplaceableEvent from "./use-replaceable-event";

export default function useUserMuteList(user?: string | ProfilePointer) {
  const pointer = useMemo(
    () =>
      user && (typeof user === "string" ? { kind: kinds.Mutelist, pubkey: user } : { kind: kinds.Mutelist, ...user }),
    [user],
  );
  return useReplaceableEvent(pointer);
}
