/**
 * Load and display social graph connections (follows, followers) between users
 * @tags loader, social-graph, follows
 * @related loader/parallel-async-loading
 */
import { castUser, User } from "applesauce-common/casts/user";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { kinds } from "applesauce-core/helpers";
import { createEventLoaderForStore, createSocialGraphLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import localforage from "localforage";
import { fromBinary, SocialGraph } from "nostr-social-graph";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BehaviorSubject, exhaustMap, Subscription, tap, throttleTime } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";
import RelayPicker from "../../components/relay-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

// Skip event signature verification for faster loading ( testing only )
eventStore.verifyEvent = undefined;

const STORAGE_GRAPH = "social-graph";
const STORAGE_ROOT = "social-graph-root";

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/", "wss://indexer.coracle.social/"],
});

// Create a social graph loader
const graphLoader = createSocialGraphLoader(pool, { eventStore });

// Live social graph instance (mutated by handleEvent as events arrive)
const socialGraph$ = new BehaviorSubject<SocialGraph | undefined>(undefined);

// The current state of the social graph sync
const syncState$ = new BehaviorSubject<{ loaded: number } | null>(null);
const sync$ = new BehaviorSubject<Subscription | null>(null);

// The current state of persisting the graph to local storage
const saveState$ = new BehaviorSubject<"idle" | "saving" | "saved">("idle");

/** Saves the current social graph and session metadata to local storage */
async function persistGraph() {
  const graph = socialGraph$.value;
  if (!graph) return;

  saveState$.next("saving");
  try {
    const data = await graph.toBinary();
    await localforage.setItem(STORAGE_GRAPH, data);
    await localforage.setItem(STORAGE_ROOT, graph.getRoot());
    saveState$.next("saved");
    setTimeout(() => {
      if (saveState$.value === "saved") saveState$.next("idle");
    }, 2000);
  } catch (err) {
    saveState$.next("idle");
    throw err;
  }
}

/** Start a new social graph crawler */
function startSocialGraphSync(relay: string, level: number, since?: number) {
  const root = socialGraph$.value?.getRoot();
  if (!root) return;

  // Reset the sync state
  syncState$.next({ loaded: 0 });

  // Create a new sync subscription
  const sub = graphLoader({ pubkey: root, relays: [relay], distance: level, since })
    .pipe(
      // Pass all events to the social graph
      tap((event) => socialGraph$.value?.handleEvent(event)),
      // Add all events to the event store
      mapEventsToStore(eventStore),
      // Update the sync state
      tap(() => {
        const current = syncState$.value ?? { loaded: 0 };
        syncState$.next({ loaded: current.loaded + 1 });
      }),
      // Limit updates to 1 per second
      throttleTime(1000),
      // Recalculate the follow distances after the throttle
      exhaustMap(async () => {
        await socialGraph$.value?.recalculateFollowDistances();
        // cooldown for 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }),
    )
    .subscribe({
      next: () => {
        console.log("Triggered re-render");
        socialGraph$.next(socialGraph$.value);
      },
      complete: () => {
        sync$.next(null);
        // Auto-save the graph when the sync completes
        persistGraph().catch((err) => console.error("Failed to persist social graph", err));
      },
    });

  sync$.next(sub);
}

/** Cancel the current running sync */
function stopSocialGraphSync() {
  const sub = sync$.value;
  if (sub) {
    sub.unsubscribe();
    sync$.next(null);
  }
}

/** Loads the social graph and session metadata from local storage, returns ms elapsed */
async function loadGraph(): Promise<number | null> {
  const start = performance.now();
  const stored = await localforage.getItem<Uint8Array>(STORAGE_GRAPH);
  const root = await localforage.getItem<string>(STORAGE_ROOT);
  if (!stored || !root) return null;

  const graph = await fromBinary(root, stored);
  socialGraph$.next(graph);
  return performance.now() - start;
}

/** Clears the social graph and session metadata from local storage */
async function clearStorage() {
  await localforage.removeItem(STORAGE_GRAPH);
  await localforage.removeItem(STORAGE_ROOT);
}

/** Simple user avatar component */
function UserAvatar({ user }: { user: User }) {
  const profile = use$(user.profile$);
  const hasContactList = eventStore.hasReplaceable(kinds.Contacts, user.pubkey);

  return (
    <div className="avatar placeholder" title={profile?.displayName ?? user.npub.slice(0, 12) + "..."}>
      <div
        className={`w-10 rounded-full bg-base-300 border-2  ${hasContactList ? "border-success" : "border-base-300"}`}
      >
        <img
          src={profile?.picture ?? `https://robohash.org/${user.pubkey}.png`}
          alt={profile?.displayName ?? user.npub.slice(0, 12) + "..."}
        />
      </div>
    </div>
  );
}

/** A row of avatars for a single follow distance */
function DistanceRow({ graph, distance }: { graph: SocialGraph; distance: number }) {
  // Force a re-render when the social graph changes
  const [update, setUpdate] = useState(0);
  useEffect(() => {
    const sub = socialGraph$.subscribe(() => setUpdate((u) => u + 1));
    return () => sub.unsubscribe();
  }, [graph]);

  // Re-compute when the graph reference changes (it re-emits after mutations)
  const pubkeys = useMemo(() => Array.from(graph.getUsersByFollowDistance(distance)).sort(), [graph, distance, update]);
  const preview = pubkeys.slice(0, 24);
  const users = useMemo(() => preview.map((pubkey) => castUser(pubkey, eventStore)), [preview.join("|")]);

  // Count contact events loaded into the store for users at this distance
  const loaded = useMemo(
    () => pubkeys.reduce((acc, pubkey) => acc + (eventStore.hasReplaceable(kinds.Contacts, pubkey) ? 1 : 0), 0) || 0,
    [pubkeys],
  );

  return (
    <tr>
      <td className="align-top w-16 font-bold text-lg">{distance}</td>
      <td className="align-top w-24 text-base-content/60">{pubkeys.length}</td>
      <td className="align-top w-24 text-base-content/60">
        {loaded} ({((loaded / pubkeys.length) * 100).toFixed(2)}%)
      </td>
      <td>
        {users.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {users.map((user) => (
              <UserAvatar key={user.pubkey} user={user} />
            ))}
          </div>
        ) : (
          <span className="text-base-content/50">No users</span>
        )}
      </td>
    </tr>
  );
}

export default function NostrSocialGraphExample() {
  const graph = use$(socialGraph$);
  const syncState = use$(syncState$);
  const sync = use$(sync$);
  const saveState = use$(saveState$);
  const isRunning = !!sync;

  const [relay, setRelay] = useState("wss://index.hzrd149.com/");
  const [level, setLevel] = useState(1); // Default to loading root and friends contacts
  // Lookback window in seconds, or null for "all time"
  const [sinceSeconds, setSinceSeconds] = useState<number | null>(null);
  const [initializing, setInitializing] = useState(true);
  // Time in milliseconds it took to load the graph from local storage
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // On mount, try to restore a graph from local storage
  useEffect(() => {
    loadGraph()
      .then((elapsed) => setLoadTime(elapsed))
      .finally(() => setInitializing(false));
  }, []);

  const root = graph?.getRoot() ?? "";

  // Update or create the graph when a new root pubkey is picked
  const handleRootChange = useCallback(async (pubkey: string) => {
    if (!pubkey) return;
    const current = socialGraph$.value;
    if (!current) {
      socialGraph$.next(new SocialGraph(pubkey));
    } else if (current.getRoot() !== pubkey) {
      // Stop any running sync before switching roots
      stopSocialGraphSync();
      await current.setRoot(pubkey);
      socialGraph$.next(current);
    }
  }, []);

  const handleStart = useCallback(() => {
    const since = sinceSeconds != null ? Math.floor(Date.now() / 1000) - sinceSeconds : undefined;
    startSocialGraphSync(relay, level, since);
  }, [relay, level, sinceSeconds]);

  const handleSave = useCallback(async () => {
    await persistGraph();
  }, []);

  const handleClear = useCallback(async () => {
    stopSocialGraphSync();
    await clearStorage();
    socialGraph$.next(undefined);
    syncState$.next(null);
    setLoadTime(null);
  }, []);

  return (
    <div className="container mx-auto my-6 p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Nostr Social Graph</h1>
        <p className="text-base-content/60 text-sm">
          Crawl and persist a{" "}
          <a className="link" href="https://github.com/mmalmi/nostr-social-graph" target="_blank" rel="noreferrer">
            nostr-social-graph
          </a>{" "}
          rooted at a pubkey. The graph is saved to local storage so it can be reloaded later.
        </p>
      </div>

      {initializing ? (
        <div className="flex items-center gap-2 text-base-content/60">
          <span className="loading loading-spinner loading-sm" />
          <span>Loading graph from storage...</span>
        </div>
      ) : (
        <>
          {/* Root pubkey picker */}
          <div>
            <label className="label pb-1">
              <span className="label-text">Root pubkey</span>
            </label>
            <PubkeyPicker value={root} onChange={handleRootChange} placeholder="Enter an npub or nostr identifier..." />
          </div>

          {/* Relay + distance + start/stop controls */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-80">
              <label className="label pb-1">
                <span className="label-text">Sync relay</span>
              </label>
              <RelayPicker value={relay} onChange={setRelay} />
            </div>

            <div>
              <label className="label pb-1">
                <span className="label-text">Sync depth</span>
              </label>
              <select
                className="select select-bordered"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                disabled={isRunning}
              >
                <option value={1}>1 (friends)</option>
                <option value={2}>2 (friends of friends)</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>

            <div>
              <label className="label pb-1">
                <span className="label-text">Since</span>
              </label>
              <select
                className="select select-bordered"
                value={sinceSeconds ?? ""}
                onChange={(e) => setSinceSeconds(e.target.value === "" ? null : Number(e.target.value))}
                disabled={isRunning}
              >
                <option value="">All time</option>
                <option value={60 * 60 * 24}>Last 24 hours</option>
                <option value={60 * 60 * 24 * 7}>Last 7 days</option>
                <option value={60 * 60 * 24 * 30}>Last 30 days</option>
                <option value={60 * 60 * 24 * 90}>Last 3 months</option>
                <option value={60 * 60 * 24 * 180}>Last 6 months</option>
                <option value={60 * 60 * 24 * 365}>Last year</option>
              </select>
            </div>

            <div className="join">
              {isRunning ? (
                <button className="btn btn-error join-item" onClick={stopSocialGraphSync}>
                  Stop
                </button>
              ) : (
                <button className="btn btn-primary join-item" onClick={handleStart} disabled={!root}>
                  Start
                </button>
              )}
              <button
                className={`btn join-item ${saveState === "saved" ? "btn-success" : ""}`}
                onClick={handleSave}
                disabled={!graph || saveState !== "idle"}
              >
                {saveState === "saving" && <span className="loading loading-spinner loading-xs" />}
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Save"}
              </button>
              <button className="btn btn-ghost join-item" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          {/* Running status */}
          <div className="flex items-center gap-3 p-3 border border-base-300 rounded-lg">
            <div className={`badge ${isRunning ? "badge-success" : "badge-ghost"} ${isRunning ? "animate-pulse" : ""}`}>
              {isRunning ? "Running" : "Idle"}
            </div>
            {isRunning && <span className="loading loading-spinner loading-xs" />}
            <span className="text-sm">
              Loaded <span className="font-bold">{syncState?.loaded ?? 0}</span> follow events
            </span>
            {loadTime != null && (
              <span className="text-sm text-base-content/60" title="Time to load graph from local storage">
                Loaded from storage in <span className="font-mono">{loadTime.toFixed(0)}ms</span>
              </span>
            )}
            {graph && (
              <span className="text-sm text-base-content/60 ml-auto">
                Graph size: <span className="font-mono">{graph.size().users}</span> users
              </span>
            )}
          </div>

          {/* Follow distance table */}
          {graph ? (
            <div className="border border-base-300 rounded-lg overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Distance</th>
                    <th>Count</th>
                    <th>Loaded</th>
                    <th>Users (up to 24)</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2, 3, 4, 5].map((distance) => (
                    <DistanceRow key={distance} graph={graph} distance={distance} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 border border-base-300 rounded-lg text-center text-base-content/60">
              Select a root pubkey above to start building a social graph.
            </div>
          )}
        </>
      )}
    </div>
  );
}
