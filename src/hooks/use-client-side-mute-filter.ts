import { useCallback } from "react";
import { useActiveAccount } from "applesauce-react/hooks";

import useLegacyMuteWordsFilter from "./use-mute-word-filter";
import useUserMuteFilter from "./use-user-mute-filter";
import { NostrEvent } from "../types/nostr-event";

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
