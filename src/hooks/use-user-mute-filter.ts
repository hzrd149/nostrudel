import { getIndexableTags, getMutedThings } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { getThreadReferences } from "../helpers/nostr/event";
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

      // Filter on muted pubkeys
      if (muted?.pubkeys) {
        if (muted.pubkeys.has(event.pubkey)) return true;
      }

      // Filter on muted hashtags`
      if (muted?.hashtags) {
        const tags = getIndexableTags(event);
        for (let tag of muted.hashtags) {
          if (tags.has("t" + tag)) return true;
        }
      }

      // Filter on muted threads
      if (muted?.threads && event.kind === kinds.ShortTextNote) {
        const refs = getThreadReferences(event);
        if (refs.root?.e && muted.threads.has(refs.root.e.id)) return true;
      }

      // Filter on muted words
      if (muted?.words) {
        const content = event.content.toLocaleLowerCase();
        for (const word of muted.words) {
          if (content.includes(word.toLocaleLowerCase())) return true;
        }
      }

      return false;
    },
    [muted, pubkey],
  );
}
