import { castUser, User } from "applesauce-common/casts";
import { ProfilePointer } from "nostr-tools/nip19";

import { eventStore } from "../services/event-store";

/**
 * Returns the {@link User} cast for a pubkey or profile pointer.
 * castUser caches instances per pubkey and relay hints, so the same instance is returned across renders.
 */
export default function useCastUser(user: string | ProfilePointer): User;
export default function useCastUser(user?: string | ProfilePointer): User | undefined;
export default function useCastUser(user?: string | ProfilePointer): User | undefined {
  return user ? castUser(user, eventStore) : undefined;
}
