import useReplaceableEvent from "./use-replaceable-event";
import { PEOPLE_LIST_KIND, getPubkeysFromList } from "../helpers/nostr/lists";
import useUserMuteList from "./use-user-mute-list";
import { useMemo } from "react";

export default function useUserMuteLists(pubkey?: string, additionalRelays: string[] = [], alwaysRequest = true) {
  const muteList = useUserMuteList(pubkey, additionalRelays, alwaysRequest);
  const altMuteList = useReplaceableEvent(
    pubkey && { kind: PEOPLE_LIST_KIND, pubkey, identifier: "mute" },
    additionalRelays,
    alwaysRequest,
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
