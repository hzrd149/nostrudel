import { useMemo } from "react";

import useReplaceableEvent from "./use-replaceable-event";
import { PEOPLE_LIST_KIND, getPubkeysFromList } from "../helpers/nostr/lists";
import useUserMuteList from "./use-user-mute-list";
import { RequestOptions } from "../services/replaceable-event-requester";

export default function useUserMuteLists(
  pubkey?: string,
  additionalRelays?: Iterable<string>,
  opts: RequestOptions = {},
) {
  const muteList = useUserMuteList(pubkey, additionalRelays, opts);
  const altMuteList = useReplaceableEvent(
    pubkey && { kind: PEOPLE_LIST_KIND, pubkey, identifier: "mute" },
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
