import { useMemo } from "react";
import { RelayConfig } from "../classes/relay";
import relayScoreboardService from "../services/relay-scoreboard";

export default function useRankedRelayConfigs(relays: RelayConfig[]) {
  return useMemo(() => {
    const rankedUrls = relayScoreboardService.getRankedRelays(relays.map((r) => r.url));
    return rankedUrls.map((u) => relays.find((r) => r.url === u) as RelayConfig);
  }, [relays.join("|")]);
}
