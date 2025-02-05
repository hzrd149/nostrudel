import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { ReplaceableQuery } from "applesauce-core/queries";

import { MONITOR_PUBKEY, MONITOR_RELAY } from "../services/relay-status-loader";
import monitorRelayStatusLoader from "../services/relay-status-loader";
import { MONITOR_STATS_KIND } from "../helpers/nostr/relay-stats";

export default function useRelayStats(relay: string) {
  useEffect(() => {
    monitorRelayStatusLoader.next({ value: relay, relays: [MONITOR_RELAY] });
  }, [relay]);

  return useStoreQuery(ReplaceableQuery, [MONITOR_STATS_KIND, MONITOR_PUBKEY, relay]);
}
