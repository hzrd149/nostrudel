/**
 * Compare events across different relays to see differences in data availability
 * @tags nip-77, negentrapy, relay, comparison
 * @related negentrapy/mentions
 */
import { defined, EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, unixNow } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { useObservableEagerState, use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { Filter, kinds } from "nostr-tools";
import { useEffect, useMemo, useState } from "react";
import { BehaviorSubject, of, startWith, switchMap } from "rxjs";
import PubkeyPicker from "../../components/pubkey-picker";

// Create relay pool for connections
const pool = new RelayPool();

// Create event store for keeping local events
const eventStore = new EventStore();

// Create loaders for the event store
// Create unified event loader for the store
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

// Pubkey of user to fetch sync data for
const pubkey$ = new BehaviorSubject<string | null>(null);

// Mailboxes of user to fetch sync data for
const mailboxes$ = pubkey$.pipe(
  defined(),
  switchMap((pubkey) => eventStore.mailboxes(pubkey)),
  startWith(undefined),
);

// Function to run negentropy sync for a single relay
const syncIdsFromRelay = async (relay: string, filter: Filter, signal: AbortSignal): Promise<string[]> => {
  const relayInstance = pool.relay(relay);

  // Check if relay supports NIP-77
  const supported = await relayInstance.getSupported();
  if (!supported?.includes(77)) throw new Error("Relay does not support NIP-77 (Negentropy)");

  return new Promise<string[]>((resolve, reject) => {
    const eventIds: string[] = [];

    // Use negentropy to get just the event IDs without sending/receiving events
    relayInstance
      .negentropy(
        [], // Empty store - we don't want to send any events
        filter,
        async (_have, need) => {
          // 'need' contains the event IDs that the relay has but we don't
          eventIds.push(...need);
          // Don't send or receive any events, just collect the IDs
        },
        { signal },
      )
      .then(() => resolve(eventIds))
      .catch(reject);
  });
};

// Type for sync results
interface SyncResult {
  relay: string;
  eventIds: string[];
  error?: string;
  loading: boolean;
}

// Component for displaying a relay badge with NIP-77 support indication
function RelayBadge({ relay }: { relay: string }) {
  const relayInstance = useMemo(() => pool.relay(relay), [relay]);
  const supported = use$(relayInstance.supported$);
  const supportsNIP77 = supported?.includes(77) || false;

  // Get hostname for display
  const hostname = useMemo(() => {
    try {
      return new URL(relay).hostname;
    } catch {
      return relay;
    }
  }, [relay]);

  return (
    <div
      className={`badge badge-sm ${
        supported === undefined ? "badge-neutral animate-pulse" : supportsNIP77 ? "badge-success" : "badge-error"
      }`}
      title={
        supported === undefined
          ? "Checking NIP-77 support..."
          : supportsNIP77
            ? "Supports NIP-77 (Negentropy)"
            : "Does not support NIP-77 (Negentropy)"
      }
    >
      {hostname}
    </div>
  );
}

// Component for displaying sync results table
function SyncResultsTable({ results, pubkey }: { results: SyncResult[]; pubkey: string | null }) {
  // Filter out relays that don't support NIP-77 (those with errors about NIP-77)
  const validResults = useMemo(() => {
    return results.filter((result) => {
      // Keep if loading, no error, or error is not about NIP-77 support
      return result.loading || !result.error || !result.error.includes("does not support NIP-77");
    });
  }, [results]);

  // Get all unique event IDs across valid relays
  const allEventIds = useMemo(() => {
    const ids = new Set<string>();
    validResults.forEach((result) => {
      result.eventIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids).sort();
  }, [validResults]);

  // Filter events to only show those missing from at least one relay
  const eventsWithDifferences = useMemo(() => {
    return allEventIds.filter((eventId) => {
      // Count how many valid relays have this event
      const relaysWithEvent = validResults.filter(
        (result) => !result.loading && !result.error && result.eventIds.includes(eventId),
      ).length;

      // Count total valid relays that have completed syncing
      const completedRelays = validResults.filter((result) => !result.loading && !result.error).length;

      // Only show if not all completed relays have this event
      return completedRelays > 0 && relaysWithEvent < completedRelays;
    });
  }, [allEventIds, validResults]);

  // Get profile for the user
  const profile = use$(() => (pubkey ? eventStore.profile({ pubkey }) : of(null)), [pubkey]);

  if (validResults.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        <p>No relays with NIP-77 support found. Only relays supporting Negentropy (NIP-77) can be compared.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Relay Event Differences</h2>
        <div className="badge badge-primary">{eventsWithDifferences.length} events with differences</div>
        {eventsWithDifferences.length < allEventIds.length && (
          <div className="badge badge-ghost">
            {allEventIds.length - eventsWithDifferences.length} events hidden (present on all relays)
          </div>
        )}
      </div>

      {pubkey && (
        <div className="bg-base-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={getProfilePicture(profile || undefined, `https://robohash.org/${pubkey}.png`)} />
              </div>
            </div>
            <div>
              <p className="font-semibold">{getDisplayName(profile || undefined, pubkey.slice(0, 8) + "...")}</p>
              <p className="text-xs text-base-content/60">Comparing outbox relays for this user</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Event ID</th>
              {validResults.map((result) => (
                <th key={result.relay} className="text-center min-w-24">
                  <RelayBadge relay={result.relay} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventsWithDifferences.map((eventId) => (
              <tr key={eventId}>
                <td className="font-mono text-xs">{eventId.slice(0, 8)}</td>
                {validResults.map((result) => (
                  <td key={result.relay} className="text-center text-lg">
                    {result.loading ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : result.error ? (
                      <div className="tooltip" data-tip={result.error}>
                        <span className="text-error">✗</span>
                      </div>
                    ) : result.eventIds.includes(eventId) ? (
                      <span className="text-success">✓</span>
                    ) : (
                      <span className="text-base-content/30">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {validResults.map((result) => {
          const percentage =
            allEventIds.length > 0 ? Math.round((result.eventIds.length / allEventIds.length) * 100) : 0;

          return (
            <div key={result.relay} className="stat bg-base-200 overflow-hidden p-2 rounded-md">
              <div className="stat-title text-xs">{new URL(result.relay).hostname}</div>
              <div className="stat-value text-lg overflow-hidden">
                {result.loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : result.error ? (
                  <span className="text-error text-sm truncate">{result.error}</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span>{result.eventIds.length}</span>
                    <span className="text-sm text-base-content/60">({percentage}%)</span>
                  </div>
                )}
              </div>
              <div className="stat-desc">{result.loading ? "Syncing..." : result.error ? "Failed" : "events"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main component
export default function RelayDifferenceExample() {
  // Time filter options
  const TIME_FILTERS = [
    { label: "Last 6 hours", hours: 6 },
    { label: "Last day", hours: 24 },
    { label: "Last 2 days", hours: 48 },
    { label: "Last week", hours: 168 },
    { label: "Last 2 weeks", hours: 336 },
    { label: "Last month", hours: 720 },
  ];

  const pubkey = useObservableEagerState(pubkey$);
  const mailboxes = use$(mailboxes$);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS[1]); // Default to "Last day"
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);

  const since = useMemo(() => unixNow() - timeFilter.hours * 60 * 60, [timeFilter]);

  // Auto-start the sync when conditions are met
  useEffect(() => {
    if (!pubkey || !mailboxes?.outboxes || mailboxes.outboxes.length === 0) {
      setSyncResults([]);
      return;
    }

    // Create a new abort controller for canceling the sync
    const controller = new AbortController();

    const filter: Filter = {
      kinds: [kinds.ShortTextNote],
      authors: [pubkey],
      since,
    };

    // Initialize results with loading state
    const initialResults: SyncResult[] = mailboxes.outboxes.map((relay) => ({
      relay,
      eventIds: [],
      loading: true,
    }));
    setSyncResults(initialResults);

    // Start syncing each relay individually
    const syncPromises = mailboxes.outboxes.map(async (relay, index) => {
      try {
        const eventIds = await syncIdsFromRelay(relay, filter, controller.signal);
        setSyncResults((prev) =>
          prev.map((result, i) => (i === index ? { ...result, eventIds, loading: false } : result)),
        );
      } catch (error) {
        setSyncResults((prev) =>
          prev.map((result, i) =>
            i === index
              ? { ...result, error: error instanceof Error ? error.message : "Unknown error", loading: false }
              : result,
          ),
        );
      }
    });

    // Execute all sync promises
    Promise.allSettled(syncPromises);

    return () => controller.abort();
  }, [pubkey, mailboxes, since]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
      <h1 className="text-3xl font-bold mb-8">Relay Event Differences</h1>

      <div className="space-y-4">
        <PubkeyPicker
          value={pubkey || ""}
          onChange={(p) => pubkey$.next(p)}
          placeholder="Enter your pubkey or nostr identifier..."
        />

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Time range to compare</span>
          </label>
          <select
            className="select select-bordered"
            value={timeFilter.hours}
            onChange={(e) => {
              const selectedFilter = TIME_FILTERS.find((f) => f.hours === parseInt(e.target.value));
              if (selectedFilter) setTimeFilter(selectedFilter);
            }}
          >
            {TIME_FILTERS.map((filter) => (
              <option key={filter.hours} value={filter.hours}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {pubkey && !mailboxes && (
          <div className="bg-warning/10 border-l-4 border-warning p-4">
            <h3 className="font-bold text-warning mb-2">Loading Mailboxes...</h3>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <p>Fetching your NIP-65 relay list...</p>
              </div>
            </div>
          </div>
        )}

        {pubkey && mailboxes && mailboxes.outboxes.length === 0 && (
          <div className="bg-error/10 border-l-4 border-error p-4">
            <h3 className="font-bold text-error mb-2">No Outbox Relays Found</h3>
            <div className="text-sm">
              <p className="mb-2">This user hasn't published a NIP-65 relay list or has no outbox relays configured.</p>
              <p className="text-xs text-base-content/60">
                Without outbox relays, we can't compare relay differences. They need to publish their relay preferences
                using a NIP-65 compatible client.
              </p>
            </div>
          </div>
        )}

        {mailboxes && mailboxes.outboxes.length > 0 && (
          <div className="bg-success/10 border-l-4 border-success p-4">
            <h3 className="font-bold text-success mb-2">Outbox Relays Detected - Syncing Event IDs</h3>
            <div className="text-sm">
              <div className="mb-3">
                <p className="mb-2">
                  <strong>Outbox relays ({mailboxes.outboxes.length}):</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {mailboxes.outboxes.map((relay) => (
                    <RelayBadge key={relay} relay={relay} />
                  ))}
                </div>
              </div>
              <p className="mb-1">
                <strong>Time range:</strong> {timeFilter.label}
              </p>
              <p className="text-xs text-base-content/60 mt-2">
                Using Negentropy (NIP-77) to compare event IDs across your outbox relays without transferring the actual
                events.
              </p>
            </div>
          </div>
        )}
      </div>

      <SyncResultsTable results={syncResults} pubkey={pubkey} />
    </div>
  );
}
