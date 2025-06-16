import { useEventModel } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { UserListsQuery } from "../models/lists";
import { useMemo } from "react";

export default function useUserSets(pubkey?: string | ProfilePointer) {
  const pointer = useMemo(() => (typeof pubkey === "string" ? { pubkey } : pubkey), [pubkey]);
  return useEventModel(UserListsQuery, pointer ? [pointer] : undefined);
}
