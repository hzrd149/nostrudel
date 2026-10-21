import { EventStore } from "applesauce-core";
import { RemoteMonitorRelayLiveness } from "applesauce-extra/remote-monitor-relay-liveness";
import { PoolLivenessSource, RelayLiveness, RelayPool } from "applesauce-relay";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i]);

/** Combines the local connection tracker and optional NIP-66 monitors into a single pool liveness source */
export class AppRelayLiveness implements PoolLivenessSource {
  /** Whether the local connection tracker is excluding relays */
  readonly localEnabled$ = new BehaviorSubject(true);
  /** The monitor-backed liveness source, undefined when no monitors are selected */
  readonly remote$ = new BehaviorSubject<RemoteMonitorRelayLiveness | undefined>(undefined);
  /** Relays excluded by any of the enabled sources */
  readonly unhealthy$: Observable<string[]>;

  private pools = new Set<RelayPool>();

  constructor(
    private store: EventStore,
    private monitorRelays: string[],
    readonly local: RelayLiveness,
  ) {
    this.unhealthy$ = combineLatest([this.localEnabled$, this.remote$]).pipe(
      switchMap(([localEnabled, remote]) =>
        combineLatest([localEnabled ? local.unhealthy$ : of([]), remote ? remote.unhealthy$ : of([])]),
      ),
      map(([localUnhealthy, remoteUnhealthy]) => Array.from(new Set([...localUnhealthy, ...remoteUnhealthy])).sort()),
      distinctUntilChanged(sameList),
      shareReplay(1),
    );
  }

  private get sources(): PoolLivenessSource[] {
    const sources: PoolLivenessSource[] = [];
    if (this.localEnabled$.value) sources.push(this.local);
    if (this.remote$.value) sources.push(this.remote$.value);
    return sources;
  }

  filter(relays: string[]): string[] {
    return this.sources.reduce((list, source) => source.filter(list), relays);
  }

  /** Starts or stops tracking relay connections locally */
  setLocalEnabled(enabled: boolean) {
    if (enabled === this.localEnabled$.value) return;

    for (const pool of this.pools) {
      if (enabled) this.local.connectToPool(pool);
      else this.local.disconnectFromPool(pool);
    }
    this.localEnabled$.next(enabled);
  }

  /** Rebuilds the remote source for the selected monitor pubkeys */
  setMonitors(pubkeys: string[]) {
    const previous = this.remote$.value;
    const remote =
      pubkeys.length > 0
        ? new RemoteMonitorRelayLiveness(this.store, {
            monitors: pubkeys.map((pubkey) => ({ pubkey, relays: this.monitorRelays })),
          })
        : undefined;

    if (remote) for (const pool of this.pools) remote.connectToPool(pool);

    // Switch consumers to the new source before tearing down the old one
    this.remote$.next(remote);
    previous?.destroy();
  }

  connectToPool(pool: RelayPool) {
    if (this.pools.has(pool)) return;
    this.pools.add(pool);

    if (this.localEnabled$.value) this.local.connectToPool(pool);
    this.remote$.value?.connectToPool(pool);
  }
}
