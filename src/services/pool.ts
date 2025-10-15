import { RelayLiveness, RelayPool } from "applesauce-relay";
import { Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, combineLatest, interval, map, merge, Observable, shareReplay, switchMap } from "rxjs";

import { nanoid } from "nanoid";

export type ConnectionState = "connecting" | "connected" | "retrying" | "dormant" | "error";

// Create a single relay pool for all relay connections
const pool = new RelayPool();

// Create a liveness tracker for relays
export const liveness = new RelayLiveness({
  storage: {
    setItem: (key, value) => {
      localStorage.setItem("liveness|" + key, JSON.stringify(value));
    },
    getItem: (key) => {
      const value = localStorage.getItem("liveness|" + key);
      return value ? JSON.parse(value) : null;
    },
  },
});
liveness.load();

// Connect to the pool and listen for connection states
liveness.connectToPool(pool);

// NOTE: hack to set default relay props
interval(1000).subscribe(() => {
  for (const relay of pool.relays.values()) {
    relay.keepAlive = 120_000;
  }
});

export const connections$ = pool.relays$.pipe(
  switchMap((relays) =>
    // Create a map of relay url -> connection state
    combineLatest(
      Object.fromEntries(
        Array.from(relays.entries()).map(([url, relay]) => [
          url,
          combineLatest([relay.connected$, relay.attempts$, relay.error$]).pipe(
            map(([connected, attempts, error]): ConnectionState => {
              if (connected) return "connected";
              if (error) return "error";
              if (!connected && attempts > 0) return "retrying";
              return "dormant";
            }),
          ),
        ]),
      ),
    ),
  ),
  shareReplay(1),
);

export type Notice = { id: string; from: string; message: string; timestamp: Date };

// capture all notices sent from relays
export const notices$ = new BehaviorSubject<Notice[]>([]);

// Subscribe to notices and add them to the notices$ subject
pool.relays$
  .pipe(
    switchMap((relays) =>
      merge(
        ...Array.from(relays.values()).map((relay) =>
          relay.notice$.pipe(
            map(
              (message) =>
                ({
                  id: nanoid(),
                  from: relay.url,
                  message: message,
                  timestamp: new Date(),
                }) as Notice,
            ),
          ),
        ),
      ),
    ),
  )
  .subscribe((notice) => {
    notices$.next([...notices$.value, notice]);
  });

export function nostrRequest(relays: string[], filters: Filter[], id?: string): Observable<NostrEvent> {
  return pool.request(relays, filters, { id });
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.pool = pool;
}

export default pool;
