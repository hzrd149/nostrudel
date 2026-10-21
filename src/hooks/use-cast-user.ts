import { castUser, User } from "applesauce-common/casts";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import { eventStore } from "../services/event-store";

/** Returns the cached {@link User} cast for a pubkey or profile pointer */
export default function useCastUser(user: string | ProfilePointer): User;
export default function useCastUser(user?: string | ProfilePointer): User | undefined;
export default function useCastUser(user?: string | ProfilePointer): User | undefined {
  const pubkey = typeof user === "string" ? user : user?.pubkey;
  const relays = typeof user === "string" ? undefined : user?.relays?.join(",");

  // keyed on pubkey and relays so a new pointer object with the same contents keeps the same cast
  return useMemo(() => (user ? castUser(user, eventStore) : undefined), [pubkey, relays]);
}
