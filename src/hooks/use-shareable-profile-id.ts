import { useMemo } from "react";
import relayScoreboardService from "../services/relay-scoreboard";
import { RelayMode } from "../classes/relay";
import { nip19 } from "nostr-tools";
import { useUserRelays } from "./use-user-relays";

export function useSharableProfileId(pubkey: string) {
  const userRelays = useUserRelays(pubkey);

  return useMemo(() => {
    const writeUrls = userRelays.filter((r) => r.mode & RelayMode.WRITE).map((r) => r.url);
    const ranked = relayScoreboardService.getRankedRelays(writeUrls);
    const onlyTwo = ranked.slice(0, 2);

    return onlyTwo.length > 0 ? nip19.nprofileEncode({ pubkey, relays: onlyTwo }) : nip19.npubEncode(pubkey);
  }, [userRelays]);
}
