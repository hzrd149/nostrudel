import { useMemo } from "react";
import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import { getPubkeysFromList } from "../helpers/nostr/lists";
import useUserMuteList from "./use-user-mute-list";
import { RequestOptions } from "../services/replaceable-events";

export default function useUserMuteLists(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const muteList = useUserMuteList(pubkey, additionalRelays, opts);
  const altMuteList = useReplaceableEvent(
    pubkey && { kind: kinds.Followsets, pubkey, identifier: "mute" },
    additionalRelays,
    opts,
  );

  const pubkeys = useMemo(() => {
    const keys = new Set<string>();
    if (muteList) for (const { pubkey } of getPubkeysFromList(muteList)) keys.add(pubkey);
    if (altMuteList) for (const { pubkey } of getPubkeysFromList(altMuteList)) keys.add(pubkey);
  }, [muteList, altMuteList]);

  return {
    muteList,
    altMuteList,
    pubkeys,
  };
}
