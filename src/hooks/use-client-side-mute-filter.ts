import { use$, useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { eventPolicies$ } from "../services/event-policies";
import useUserMuteFilter from "./use-user-mute-filter";

/** Returns Whether the event should be hidden in the UI */
export default function useClientSideMuteFilter(user?: string): (event: NostrEvent) => boolean {
  const account = useActiveAccount();
  const pubkey = user || account?.pubkey;

  const muteListFilter = useUserMuteFilter(pubkey);
  const policies = use$(eventPolicies$);

  return useCallback(
    (event: NostrEvent) => {
      // Never mute the users own events
      if (event.pubkey === pubkey) return false;
      if (muteListFilter(event)) return true;
      if (policies?.shouldHideEvent(event)) return true;

      return false;
    },
    [pubkey, muteListFilter, policies],
  );
}
