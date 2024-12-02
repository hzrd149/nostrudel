import { useCallback, useMemo } from "react";
import { kinds } from "nostr-tools";

import useCurrentAccount from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import { NostrEvent } from "../types/nostr-event";
import { getStreamHost } from "../helpers/nostr/stream";
import { RequestOptions } from "../services/replaceable-events";

export default function useUserMuteFilter(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const muteList = useUserMuteList(pubkey || account?.pubkey, additionalRelays, { ignoreCache: true, ...opts });
  const pubkeys = useMemo(() => (muteList ? getPubkeysFromList(muteList).map((p) => p.pubkey) : []), [muteList]);

  return useCallback(
    (event: NostrEvent) => {
      if (event.kind === kinds.LiveEvent) {
        const host = getStreamHost(event);
        if (pubkeys.includes(host)) return true;
      }
      return pubkeys.includes(event.pubkey);
    },
    [pubkeys],
  );
}
