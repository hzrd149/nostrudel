import { useCallback, useMemo } from "react";

import useCurrentAccount from "./use-current-account";
import useUserMuteList from "./use-user-mute-list";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import { NostrEvent } from "../types/nostr-event";
import { STREAM_KIND, getStreamHost } from "../helpers/nostr/stream";
import { RequestOptions } from "../services/replaceable-event-requester";

export default function useUserMuteFilter(pubkey?: string, additionalRelays?: string[], opts?: RequestOptions) {
  const account = useCurrentAccount();
  const muteList = useUserMuteList(pubkey || account?.pubkey, additionalRelays, { ignoreCache: true, ...opts });
  const pubkeys = useMemo(() => (muteList ? getPubkeysFromList(muteList).map((p) => p.pubkey) : []), [muteList]);

  return useCallback(
    (event: NostrEvent) => {
      if (event.kind === STREAM_KIND) {
        if (pubkeys.includes(getStreamHost(event))) return true;
      }
      return pubkeys.includes(event.pubkey);
    },
    [pubkeys],
  );
}
