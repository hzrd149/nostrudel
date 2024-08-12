import { useCallback } from "react";

import useCurrentAccount from "./use-current-account";
import useWordMuteFilter from "./use-mute-word-filter";
import useUserMuteFilter from "./use-user-mute-filter";
import { NostrEvent } from "../types/nostr-event";

export default function useClientSideMuteFilter() {
  const account = useCurrentAccount();

  const wordMuteFilter = useWordMuteFilter();
  const mustListFilter = useUserMuteFilter(account?.pubkey);

  return useCallback(
    (event: NostrEvent) => {
      if (event.pubkey === account?.pubkey) return false;
      return wordMuteFilter(event) || mustListFilter(event);
    },
    [wordMuteFilter, mustListFilter, account?.pubkey],
  );
}
