import { combineLatestByValue } from "applesauce-core/observable";
import { combineLatest, map, shareReplay } from "rxjs";

import AppRelayPool from "../classes/app-relay";
import { relayInformationCache } from "./relay-information-cache";
import liveness from "./relay-liveness";

export type ConnectionState = "connecting" | "connected" | "retrying" | "dormant" | "error";

// Create a single relay pool for all relay connections
const pool = new AppRelayPool({ keepAlive: 60_000, informationCache: relayInformationCache, liveness });

// Map of relay url -> connection state. Built like pool.status$, but RelayStatus has no attempts or error
export const connections$ = pool.relays$.pipe(
  map((relays) => Array.from(relays.values())),
  combineLatestByValue((relay) =>
    combineLatest([relay.connected$, relay.attempts$, relay.error$]).pipe(
      map(([connected, attempts, error]): [string, ConnectionState] => {
        if (connected) return [relay.url, "connected"];
        if (error) return [relay.url, "error"];
        if (attempts > 0) return [relay.url, "retrying"];
        return [relay.url, "dormant"];
      }),
    ),
  ),
  map((states) => Object.fromEntries(states.values())),
  shareReplay(1),
);

if (import.meta.env.DEV) {
  Reflect.set(window, "pool", pool);
}

export default pool;
