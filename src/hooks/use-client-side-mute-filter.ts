import { useActiveAccount, useObservableEagerState } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { getViolations } from "../services/event-policies";
import localSettings from "../services/local-settings";
import useUserMuteFilter from "./use-user-mute-filter";

/** Returns Whether the event should be hidden in the UI */
export default function useClientSideMuteFilter(user?: string): (event: NostrEvent) => boolean {
  const account = useActiveAccount();
  user = user || account?.pubkey;

  const muteListFilter = useUserMuteFilter(user);
  const policy = useObservableEagerState(localSettings.eventsPolicy);

  return useCallback(
    (event: NostrEvent) => {
      // Never mute the users own events
      if (event.pubkey === user) return false;
      if (muteListFilter(event)) return true;

      // TODO: these violations should be exposed in the UI somewhere
      if (getViolations(event, policy).length > 0) return true;

      return false;
    },
    [muteListFilter],
  );
}
