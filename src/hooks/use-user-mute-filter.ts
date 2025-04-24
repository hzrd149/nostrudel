import { getMutedThings, matchMutes } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import useUserMuteList from "./use-user-mute-list";

/** Returns a function that filters events based on the users mute list */
export default function useUserMuteFilter(pubkey?: string, additionalRelays?: string[], force?: boolean) {
  const account = useActiveAccount();
  pubkey = pubkey || account?.pubkey;

  const mute = useUserMuteList(pubkey, additionalRelays, force);
  const muted = mute && getMutedThings(mute);

  return useCallback(
    (event: NostrEvent) => {
      // Never mute the users own events
      if (event.pubkey === pubkey) return false;

      return muted ? matchMutes(muted, event) : false;
    },
    [muted, pubkey],
  );
}
