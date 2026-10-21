import { EventStore, mapEventsToStore } from "applesauce-core";
import { relaySet } from "applesauce-core/helpers";
import { SyncLoader, SyncLoaderStatus, TimelineWindow } from "applesauce-loaders/loaders";
import { Filter, NostrEvent } from "nostr-tools";
import {
  catchError,
  concat,
  defer,
  distinctUntilChanged,
  EMPTY,
  groupBy,
  ignoreElements,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  scan,
  share,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";

export type NotificationWindowStatus = {
  since: number;
  until: number;
  hydrating: boolean;
  cacheError?: Error;
  error?: Error;
  cacheMs?: number;
  firstEventMs?: number;
  elapsedMs: number;
  status?: SyncLoaderStatus;
};

export type NotificationSyncState = {
  since: number;
  until: number;
  windows: NotificationWindowStatus[];
  done: boolean;
  failedRelays: string[];
  liveError?: Error;
  pendingParents?: number;
  failedParents?: number;
  loadMore: () => void;
  ensureSince: (since: number) => void;
  retry: () => void;
};

type SyncOptions = {
  filter: Filter;
  relays$: Observable<string[]>;
  window: TimelineWindow;
  eventStore: EventStore;
  syncLoader: SyncLoader;
  cacheRequest: (filters: Filter[]) => Observable<NostrEvent>;
  subscribeLive: (relays: string[], filter: Filter) => Observable<NostrEvent>;
  onError: (error: Error) => void;
};

type Update = { window: NotificationWindowStatus } | { liveError: Error | undefined };

export function getNotificationSyncSummary(state: NotificationSyncState | undefined) {
  return {
    loading: !state || !state.done,
    incomplete:
      !!state &&
      (!!state.liveError ||
        state.failedRelays.length > 0 ||
        !!state.failedParents ||
        state.windows.some((window) => !!window.error)),
    noRelays:
      !!state?.done &&
      state.windows.some((window) => !window.error && Object.keys(window.status?.relays ?? {}).length === 0),
  };
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function syncWindow(options: SyncOptions, relays$: Observable<string[]>, since: number, until: number) {
  return defer(() => {
    const started = Date.now();
    const filter = { ...options.filter, since, until };
    let window: NotificationWindowStatus = { since, until, hydrating: true, elapsedMs: 0 };
    const update = (): Update => ({ window: { ...window, elapsedMs: Date.now() - started } });

    const hydrate$ = defer(() => options.cacheRequest([filter])).pipe(
      mapEventsToStore(options.eventStore),
      ignoreElements(),
      catchError((error: unknown) => {
        window.cacheError = asError(error);
        options.onError(window.cacheError);
        return EMPTY;
      }),
    );

    return concat(
      of(update()),
      hydrate$,
      defer(() => {
        window = { ...window, hydrating: false, cacheMs: Date.now() - started };
        const run = options.syncLoader({ relays: relays$, filter });
        return merge(
          run.status$.pipe(
            map((status) => {
              window = { ...window, status };
              return update();
            }),
          ),
          run.events$.pipe(
            tap(() => {
              window.firstEventMs ??= Date.now() - started;
            }),
            ignoreElements(),
          ),
        );
      }),
    ).pipe(
      catchError((error: unknown) => {
        const cause = asError(error);
        options.onError(cause);
        window = { ...window, hydrating: false, error: cause };
        return of(update());
      }),
    );
  });
}

function updateState(state: NotificationSyncState, update: Update): NotificationSyncState {
  if ("liveError" in update) return { ...state, liveError: update.liveError };

  const windows = [...state.windows.filter((window) => window.since !== update.window.since), update.window];
  const failedRelays = new Set<string>();
  for (const window of windows) {
    for (const relay of Object.values(window.status?.relays ?? {})) {
      if (relay.state === "error" || relay.state === "skipped") failedRelays.add(relay.relay);
    }
  }
  return {
    ...state,
    since: Math.min(state.since, update.window.since),
    windows,
    done: windows.every((window) => !window.hydrating && (window.error || window.status?.done === true)),
    failedRelays: [...failedRelays],
  };
}

/** Share cache hydration, history sync and live acquisition for one notification filter. */
export function createNotificationSync(options: SyncOptions): Observable<NotificationSyncState> {
  return defer(() => {
    const { since, until } = options.window;
    const older$ = new Subject<{ since: number; until: number }>();
    const retry$ = new Subject<void>();
    const relays$ = options.relays$.pipe(
      map((relays) => relaySet(relays).sort()),
      distinctUntilChanged((a, b) => a.length === b.length && a.every((relay, i) => relay === b[i])),
      share({ connector: () => new ReplaySubject<string[]>(1) }),
    );
    let latest: NotificationSyncState = {
      since,
      until,
      windows: [],
      done: false,
      failedRelays: [],
      loadMore: () => {
        if (!latest.done || latest.since === 0) return;
        latest.ensureSince(Math.max(0, latest.since - (until - latest.since)));
      },
      ensureSince: (requested) => {
        const since = Math.max(0, Math.floor(requested));
        if (!Number.isFinite(since) || since >= latest.since) return;
        older$.next({ since, until: latest.since - 1 });
      },
      retry: () => {
        for (const window of latest.windows) older$.next({ since: window.since, until: window.until });
        retry$.next();
      },
    };

    // Capture the live boundary before hydration, so events arriving during sync are included.
    const live$ = relays$.pipe(
      switchMap((relays) =>
        retry$.pipe(
          startWith(undefined),
          map(() => relays),
        ),
      ),
      switchMap((relays) =>
        concat(
          of<Update>({ liveError: undefined }),
          defer(() => {
            const filter = { ...options.filter, since: until };
            delete filter.until;
            delete filter.limit;
            return options.subscribeLive(relays, filter);
          }).pipe(
            mapEventsToStore(options.eventStore),
            ignoreElements(),
            catchError((error: unknown) => {
              const liveError = asError(error);
              options.onError(liveError);
              return of<Update>({ liveError });
            }),
          ),
        ),
      ),
    );
    const history$ = concat(of({ since, until }), older$).pipe(
      groupBy((window) => window.since),
      mergeMap((windows$) =>
        windows$.pipe(switchMap((window) => syncWindow(options, relays$, window.since, window.until))),
      ),
    );

    return merge(live$, history$).pipe(
      scan(updateState, latest),
      tap((state) => {
        latest = state;
      }),
    );
  }).pipe(share({ connector: () => new ReplaySubject<NotificationSyncState>(1) }));
}
