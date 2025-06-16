import { getMutedThings, matchMutes } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { useCallback } from "react";

import useUserMuteList from "./use-user-mute-list";

/** Returns a function that filters events based on the users mute list */
export default function useUserMuteFilter(user?: string | ProfilePointer) {
  const account = useActiveAccount();
  user = user || account?.pubkey;

  const mute = useUserMuteList(user);
  const muted = mute && getMutedThings(mute);

  return useCallback(
    (event: NostrEvent) => {
      // Never mute the users own events
      if (event.pubkey === user) return false;

      return muted ? matchMutes(muted, event) : false;
    },
    [muted, user],
  );
}
