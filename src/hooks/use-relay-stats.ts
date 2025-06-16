import { useEventModel } from "applesauce-react/hooks";

import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { defer, ignoreElements, mergeWith } from "rxjs";
import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";
import monitorRelayStatusLoader, { MONITOR_PUBKEY, MONITOR_RELAY } from "../services/relay-status-loader";

function RelayStatsQuery(relay: string): Model<NostrEvent | undefined> {
  return (events) =>
    defer(() => monitorRelayStatusLoader({ relays: [MONITOR_RELAY], value: relay })).pipe(
      ignoreElements(),
      mergeWith(events.replaceable(MONITOR_STATS_KIND, MONITOR_PUBKEY, relay)),
    );
}

export default function useRelayStats(relay: string) {
  return useEventModel(RelayStatsQuery, [relay]);
}
