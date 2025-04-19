import { useCallback } from "react";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";

import useLegacyMuteWordsFilter from "./use-mute-word-filter";
import useUserMuteFilter from "./use-user-mute-filter";

/** @deprecated Use useUserMuteFilter once the legacy mute words filter is removed */
export default function useClientSideMuteFilter(pubkey?: string) {
  const account = useActiveAccount();
  pubkey = pubkey || account?.pubkey;

  const legacyMuteWords = useLegacyMuteWordsFilter();
  const mustListFilter = useUserMuteFilter(pubkey);

  return useCallback(
    (event: NostrEvent) => legacyMuteWords(event) || mustListFilter(event),
    [legacyMuteWords, mustListFilter],
  );
}
