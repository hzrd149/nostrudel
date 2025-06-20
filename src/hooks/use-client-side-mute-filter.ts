import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { shouldHideEvent } from "../services/event-policies";
import useUserMuteFilter from "./use-user-mute-filter";

/** Returns Whether the event should be hidden in the UI */
export default function useClientSideMuteFilter(user?: string): (event: NostrEvent) => boolean {
  const account = useActiveAccount();
  user = user || account?.pubkey;

  const muteListFilter = useUserMuteFilter(user);

  return useCallback(
    (event: NostrEvent) => {
      // Never mute the users own events
      if (event.pubkey === user) return false;
      if (muteListFilter(event)) return true;
      if (shouldHideEvent(event)) return true;

      return false;
    },
    [muteListFilter],
  );
}
