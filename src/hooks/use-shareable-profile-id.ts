import { useMemo } from "react";
import { nip19 } from "nostr-tools";

import relayScoreboardService from "../services/relay-scoreboard";
import useUserMailboxes from "./use-user-mailboxes";

/** @deprecated */
export function useSharableProfileId(pubkey: string, relayCount = 2) {
  const mailboxes = useUserMailboxes(pubkey);

  return useMemo(() => {
    const ranked = relayScoreboardService.getRankedRelays(mailboxes?.outbox.urls);
    const onlyTwo = ranked.slice(0, relayCount);
    return onlyTwo.length > 0 ? nip19.nprofileEncode({ pubkey, relays: onlyTwo }) : nip19.npubEncode(pubkey);
  }, [mailboxes]);
}
