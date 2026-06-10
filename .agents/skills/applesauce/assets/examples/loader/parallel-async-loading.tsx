/**
 * Load multiple user profiles in parallel with async operations
 * @tags nip-65, loader, async, parallel
 * @related loader/social-graph
 */
import { castUser } from "applesauce-common/casts";
import { EventStore } from "applesauce-core";
import { kinds, NostrEvent } from "applesauce-core/helpers";
import { mapEventsToTimeline } from "applesauce-core/observable";
import { loadAsyncMap } from "applesauce-loaders/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { RelayPool } from "applesauce-relay";
import { useEffect, useState } from "react";
import { lastValueFrom } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

// Setup event store and relay pool
const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"],
});

/** Load user profile, mailboxes, and events in parallel */
async function loadUserData(pubkey: string, timeout: number) {
  // Create user instance
  const user = castUser(pubkey, eventStore);

  // Load all data in parallel using loadAsyncMap
  return loadAsyncMap(
    {
      // hard coded timeout to test the global timeout
      profile: user.profile$.$first(30_000),
      // Using default timeout (unknown)
      mailboxes: user.mailboxes$.$first(),
      events: user.outboxes$.$first().then((relays) => {
        if (relays.length === 0) return [];

        // Request last 10 kind 1 events from user's mailboxes
        return lastValueFrom(
          pool
            .request(relays, {
              kinds: [kinds.ShortTextNote],
              authors: [pubkey],
              limit: 10,
            })
            .pipe(mapEventsToTimeline()),
        );
      }) satisfies Promise<NostrEvent[]>,
    },
    timeout,
  );
}

export default function ParallelAsyncLoadingExample() {
  const [pubkey, setPubkey] = useState<string>("");
  const [timeout, setTimeout] = useState<number>(30000);
  const [data, setData] = useState<Awaited<ReturnType<typeof loadUserData>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    if (!pubkey.trim()) {
      setData(null);
      setError(null);
      setLoadTime(null);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    loadUserData(pubkey, timeout)
      .then((result) => {
        const elapsed = performance.now() - startTime;
        setData(result);
        setLoadTime(elapsed);
        setLoading(false);
      })
      .catch((err) => {
        const elapsed = performance.now() - startTime;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setLoadTime(elapsed);
        setLoading(false);
      });
  }, [pubkey, timeout]);

  return (
    <div className="container mx-auto my-8 px-4 max-w-6xl">
      <h1 className="font-bold mb-6">Parallel Async Loading Example</h1>
      <p className="mb-6 text-base-content/70">
        This example demonstrates loading user profile, mailboxes, and events in parallel using{" "}
        <code className="bg-base-200 px-2 py-1 rounded">loadAsyncMap</code> for server-side rendering scenarios.
      </p>

      <div className="mb-6 space-y-4">
        <PubkeyPicker value={pubkey} onChange={setPubkey} placeholder="Enter pubkey or nostr identifier..." />
        <div className="flex items-center gap-2">
          <label htmlFor="timeout" className="font-semibold">
            Timeout (ms):
          </label>
          <input
            id="timeout"
            type="number"
            min="100"
            step="100"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            className="input input-bordered w-32"
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {loadTime !== null && !loading && (
        <div className="mb-4 p-3 bg-base-200 rounded">
          <span className="font-semibold">Load time: </span>
          <span className="font-mono">{loadTime.toFixed(2)}ms</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="ml-4">Loading user data in parallel...</span>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title mb-4">Profile</h2>
              {data.profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="avatar">
                      <div className="w-24 rounded-full">
                        <img
                          src={data.profile.picture || `https://robohash.org/${pubkey}.png`}
                          alt={data.profile.displayName || pubkey}
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold">{data.profile.displayName || pubkey}</h3>
                      <p className="text-base-content/60 font-mono">{pubkey.slice(0, 16)}...</p>
                    </div>
                  </div>

                  {data.profile.name && (
                    <div>
                      <span className="font-semibold">Name:</span> {data.profile.name}
                    </div>
                  )}

                  {data.profile.about && (
                    <div>
                      <span className="font-semibold">About:</span>
                      <p className="mt-1">{data.profile.about}</p>
                    </div>
                  )}

                  {data.profile.website && (
                    <div>
                      <span className="font-semibold">Website:</span>{" "}
                      <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="link">
                        {data.profile.website}
                      </a>
                    </div>
                  )}

                  {data.profile.dnsIdentity && (
                    <div>
                      <span className="font-semibold">NIP-05:</span> {data.profile.dnsIdentity}
                    </div>
                  )}

                  {data.profile.lightningAddress && (
                    <div>
                      <span className="font-semibold">Lightning Address:</span> {data.profile.lightningAddress}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-base-content/60">Profile not available</p>
              )}
            </div>
          </div>

          {/* Mailboxes Section */}
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title mb-4">Mailboxes (NIP-65)</h2>
              {data.mailboxes ? (
                <div className="space-y-4">
                  {data.mailboxes.outboxes && data.mailboxes.outboxes.length > 0 && (
                    <div>
                      <span className="font-semibold">Outboxes:</span>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {data.mailboxes.outboxes.map((relay, idx) => (
                          <li key={idx} className="font-mono">
                            {relay}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.mailboxes.inboxes && data.mailboxes.inboxes.length > 0 && (
                    <div>
                      <span className="font-semibold">Inboxes:</span>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {data.mailboxes.inboxes.map((relay, idx) => (
                          <li key={idx} className="font-mono">
                            {relay}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!data.mailboxes.outboxes || data.mailboxes.outboxes.length === 0) &&
                    (!data.mailboxes.inboxes || data.mailboxes.inboxes.length === 0) && (
                      <p className="text-base-content/60">No mailboxes found</p>
                    )}
                </div>
              ) : (
                <p className="text-base-content/60">Mailboxes not available</p>
              )}
            </div>
          </div>

          {/* Events Section */}
          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title mb-4">Last 10 Kind 1 Events</h2>
              {data.events && data.events.length > 0 ? (
                <div className="space-y-4">
                  {data.events.map((event) => (
                    <div key={event.id} className="border border-base-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base-content/60 font-mono">
                          {new Date(event.created_at * 1000).toLocaleString()}
                        </span>
                        <span className="text-base-content/60">•</span>
                        <span className="text-base-content/60 font-mono">{event.id.slice(0, 16)}...</span>
                      </div>
                      <p className="whitespace-pre-wrap">{event.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/60">No events found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !data && pubkey && (
        <div className="text-center py-12 text-base-content/60">
          <p>Enter a pubkey above to load user data</p>
        </div>
      )}
    </div>
  );
}
