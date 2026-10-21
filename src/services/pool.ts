import { combineLatestByValue } from "applesauce-core/observable";
import { combineLatest, distinctUntilChanged, map, shareReplay } from "rxjs";

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
      map(([connected, attempts, error]): ConnectionState => {
        if (connected) return "connected";
        if (error) return "error";
        if (attempts > 0) return "retrying";
        return "dormant";
      }),
      // Retry attempts and repeated errors don't change the state, so only emit transitions
      distinctUntilChanged(),
      map((state): [string, ConnectionState] => [relay.url, state]),
    ),
  ),
  map((states) => Object.fromEntries(states.values())),
  shareReplay(1),
);

/** Connection state of a single relay, only emitting when that relay's state changes */
export function connectionState$(relay: string) {
  return connections$.pipe(
    map((connections): ConnectionState | undefined => connections[relay]),
    distinctUntilChanged(),
  );
}

if (import.meta.env.DEV) {
  Reflect.set(window, "pool", pool);
}

export default pool;
