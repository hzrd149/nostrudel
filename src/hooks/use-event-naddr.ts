import { useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import { nip19 } from "nostr-tools";
import { getEventRelays } from "../services/event-relays";
import relayScoreboardService from "../services/relay-scoreboard";

export default function useEventNaddr(event: NostrEvent, overrideRelays?: string[]) {
  return useMemo(() => {
    const identifier = event.tags.find((t) => t[0] === "d" && t[1])?.[1];
    const relays = overrideRelays || getEventRelays(event.id).value;
    const ranked = relayScoreboardService.getRankedRelays(relays);
    const onlyTwo = ranked.slice(0, 2);

    if (!identifier) return null;

    return nip19.naddrEncode({
      identifier,
      relays: onlyTwo,
      pubkey: event.pubkey,
      kind: event.kind,
    });
  }, [event]);
}
